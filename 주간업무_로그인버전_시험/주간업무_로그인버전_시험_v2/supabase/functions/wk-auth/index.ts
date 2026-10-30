// =====================================================================
// 주간 업무 · 로그인 서버 함수 (Supabase Edge Function 이름: wk-auth)
//   login       : 회사 메일 + 숫자 비밀번호 → 로그인 (5번 틀리면 10분 잠금)
//   change_pin  : 내 비밀번호를 숫자 6자리로 바꾸기
//   reset_pin   : (등록 담당자·관리자) 비밀번호를 0426으로 초기화
// 필요한 비밀값(Secrets): PIN_SECRET  — 아무 긴 문자열. 한 번 정하면 바꾸지 마세요.
// 설정: 이 함수의 "Verify JWT(Enforce JWT verification)"는 꺼 주세요. 필요한 확인은 함수가 직접 합니다.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const DEFAULT_PIN = "0426";
const MAX_FAILS = 5;
const LOCK_MINUTES = 10;

// 새 키(SUPABASE_SECRET_KEYS / SUPABASE_PUBLISHABLE_KEYS: {"default":"sb_..."})를 먼저 쓰고, 없으면 예전 키를 씀
function envKey(newName: string, legacyName: string): string {
  const raw = Deno.env.get(newName);
  if (raw) {
    try {
      const o = JSON.parse(raw);
      if (typeof o === "string") return o;
      if (o && typeof o === "object") return (o.default ?? Object.values(o)[0]) as string;
    } catch { return raw; }
  }
  return Deno.env.get(legacyName) ?? "";
}
const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
const ANON = envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
const SECRET = Deno.env.get("PIN_SECRET") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const anonClient = () => createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });

const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

// 실제 Supabase 비밀번호 = HMAC(PIN_SECRET, 메일|숫자). 숫자만 알아서는 서버 함수를 거치지 않고 로그인할 수 없음
async function derive(email: string, pin: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${email}|${pin}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function pinProblem(pin: string): string | null {
  if (!/^\d{6}$/.test(pin)) return "숫자 6자리로 입력해 주세요.";
  if (/^(\d)\1{5}$/.test(pin)) return "같은 숫자만 반복할 수는 없어요.";
  const d = [...pin].map(Number);
  const up = d.every((v, i) => i === 0 || v === (d[i - 1] + 1) % 10);
  const down = d.every((v, i) => i === 0 || v === (d[i - 1] + 9) % 10);
  if (up || down) return "123456처럼 이어지는 숫자는 쓸 수 없어요.";
  if (pin.startsWith(DEFAULT_PIN)) return "처음 비밀번호(0426)로 시작하는 번호는 쓸 수 없어요.";
  return null;
}

async function getPerson(email: string) {
  const { data } = await admin.from("wk_people").select("*").eq("email", email).maybeSingle();
  return data as null | { email: string; name: string; team_id: string; role: string; is_admin: boolean; is_registrar: boolean; active: boolean; must_change: boolean };
}
async function getState(email: string) {
  const { data } = await admin.from("wk_auth_state").select("*").eq("email", email).maybeSingle();
  return data as null | { email: string; auth_uid: string | null; fails: number; lock_until: string | null };
}
async function saveState(email: string, patch: Record<string, unknown>) {
  await admin.from("wk_auth_state").upsert({ email, ...patch, updated_at: new Date().toISOString() }, { onConflict: "email" });
}
function lockLeft(st: { lock_until: string | null } | null): number {
  if (!st?.lock_until) return 0;
  const ms = new Date(st.lock_until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}
// 틀린 횟수 올리기. 잠기면 남은 초를 돌려줌
async function addFail(email: string, st: { fails: number } | null): Promise<{ left: number; lockedFor: number }> {
  const fails = (st?.fails ?? 0) + 1;
  if (fails >= MAX_FAILS) {
    const until = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
    await saveState(email, { fails: 0, lock_until: until });
    return { left: 0, lockedFor: LOCK_MINUTES * 60 };
  }
  await saveState(email, { fails, lock_until: null });
  return { left: MAX_FAILS - fails, lockedFor: 0 };
}

// Supabase 로그인 사용자 찾기 (상태표에 uid가 없을 때 대비)
async function findAuthUid(email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const u = data.users.find((x) => (x.email ?? "").toLowerCase() === email);
    if (u) return u.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function callerOf(req: Request) {
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user?.email) return null;
  return { uid: data.user.id, email: data.user.email.toLowerCase() };
}

async function login(body: Record<string, unknown>) {
  const email = normEmail(body.email);
  const pin = String(body.pin ?? "");
  const bad = (extra: Record<string, unknown> = {}) => json(401, { error: "bad_login", message: "메일 또는 비밀번호가 맞지 않아요.", ...extra });
  if (!email.includes("@") || !/^\d{4,6}$/.test(pin)) return bad();

  const person = await getPerson(email);
  if (!person || !person.active) return bad();

  let st = await getState(email);
  const locked = lockLeft(st);
  if (locked) return json(423, { error: "locked", seconds: locked, message: `비밀번호를 여러 번 틀려서 잠겼어요. ${Math.ceil(locked / 60)}분 뒤에 다시 해주세요.` });

  const password = await derive(email, pin);

  // 처음 로그인: 아직 로그인 계정이 없으면 0426일 때만 만들어 줌
  if (!st?.auth_uid) {
    let uid = await findAuthUid(email);
    if (!uid) {
      if (pin !== DEFAULT_PIN || !person.must_change) {
        const f = await addFail(email, st);
        return f.lockedFor ? json(423, { error: "locked", seconds: f.lockedFor, message: `비밀번호를 여러 번 틀려서 잠겼어요. ${LOCK_MINUTES}분 뒤에 다시 해주세요.` }) : bad({ left: f.left });
      }
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error || !data?.user) return json(500, { error: "create_failed", message: "로그인 계정을 만들지 못했어요. 관리자에게 알려주세요." });
      uid = data.user.id;
    }
    await saveState(email, { auth_uid: uid, fails: st?.fails ?? 0 });
    st = await getState(email);
  }

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error || !data?.session) {
    const f = await addFail(email, st);
    return f.lockedFor ? json(423, { error: "locked", seconds: f.lockedFor, message: `비밀번호를 여러 번 틀려서 잠겼어요. ${LOCK_MINUTES}분 뒤에 다시 해주세요.` }) : bad({ left: f.left });
  }
  await saveState(email, { fails: 0, lock_until: null, last_login: new Date().toISOString() });
  return json(200, {
    session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
    must_change: person.must_change,
  });
}

async function changePin(req: Request, body: Record<string, unknown>) {
  const me = await callerOf(req);
  if (!me) return json(401, { error: "no_session", message: "다시 로그인해 주세요." });
  const person = await getPerson(me.email);
  if (!person || !person.active) return json(403, { error: "inactive", message: "사용할 수 없는 계정이에요." });

  const st = await getState(me.email);
  const locked = lockLeft(st);
  if (locked) return json(423, { error: "locked", seconds: locked, message: `비밀번호를 여러 번 틀려서 잠겼어요. ${Math.ceil(locked / 60)}분 뒤에 다시 해주세요.` });

  const oldPin = String(body.old_pin ?? "");
  const newPin = String(body.new_pin ?? "");
  const { error: vErr } = await anonClient().auth.signInWithPassword({ email: me.email, password: await derive(me.email, oldPin) });
  if (vErr) {
    const f = await addFail(me.email, st);
    return json(f.lockedFor ? 423 : 401, { error: "bad_old", left: f.left, message: "지금 비밀번호가 맞지 않아요." });
  }
  const p = pinProblem(newPin);
  if (p) return json(400, { error: "weak_pin", message: p });
  if (newPin === oldPin) return json(400, { error: "same_pin", message: "지금과 다른 번호로 정해 주세요." });

  const { error } = await admin.auth.admin.updateUserById(me.uid, { password: await derive(me.email, newPin) });
  if (error) return json(500, { error: "update_failed", message: "비밀번호를 바꾸지 못했어요. 잠시 후 다시 해주세요." });
  await admin.from("wk_people").update({ must_change: false }).eq("email", me.email);
  await saveState(me.email, { auth_uid: me.uid, fails: 0, lock_until: null });
  return json(200, { ok: true });
}

async function resetPin(req: Request, body: Record<string, unknown>) {
  const me = await callerOf(req);
  if (!me) return json(401, { error: "no_session", message: "다시 로그인해 주세요." });
  const caller = await getPerson(me.email);
  if (!caller || !caller.active || caller.must_change || !(caller.is_admin || caller.is_registrar)) {
    return json(403, { error: "not_allowed", message: "등록 담당자나 관리자만 할 수 있어요." });
  }
  const email = normEmail(body.email);
  const target = await getPerson(email);
  if (!target) return json(404, { error: "no_person", message: "등록되지 않은 메일이에요." });
  if (target.is_admin && !caller.is_admin) return json(403, { error: "not_allowed", message: "관리자의 비밀번호는 관리자만 초기화할 수 있어요." });

  const st = await getState(email);
  const uid = st?.auth_uid ?? (await findAuthUid(email));
  if (uid) {
    const { error } = await admin.auth.admin.updateUserById(uid, { password: await derive(email, DEFAULT_PIN) });
    if (error) return json(500, { error: "update_failed", message: "초기화하지 못했어요. 잠시 후 다시 해주세요." });
  }
  await admin.from("wk_people").update({ must_change: true }).eq("email", email);
  await saveState(email, { auth_uid: uid, fails: 0, lock_until: null });
  return json(200, { ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method" });
  if (!SECRET) return json(500, { error: "setup_secret", message: "서버 설정(PIN_SECRET)이 빠져 있어요. 관리자에게 알려주세요." });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json(400, { error: "bad_json" }); }
  try {
    switch (body.action) {
      case "login": return await login(body);
      case "change_pin": return await changePin(req, body);
      case "reset_pin": return await resetPin(req, body);
      default: return json(400, { error: "unknown_action" });
    }
  } catch (e) {
    console.error(e);
    return json(500, { error: "server", message: "서버에서 문제가 생겼어요. 잠시 후 다시 해주세요." });
  }
});
