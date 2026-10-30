-- =====================================================================
-- 주간 업무 · 로그인 버전 — Supabase 설정 1/2
-- Supabase > SQL Editor 에 전체를 붙여넣고 Run.  여러 번 실행해도 안전합니다.
-- 지금 쓰고 있는 weekly_items / weekly_config 표는 건드리지 않습니다.
-- =====================================================================

-- ---------- 표 ----------
create table if not exists public.wk_teams (
  id          text primary key,                       -- 예: quality
  name        text not null,                          -- 예: 고객품질팀
  sort        int  not null default 100,
  features    jsonb not null default '{}'::jsonb,     -- 팀별 기능 켜기/끄기 예: {"trip":true}
  lists       jsonb not null default '{}'::jsonb,     -- 팀 기본 목록 {customers:[],vendors:[],cats:[]}
  updated_at  timestamptz not null default now()
);

create table if not exists public.wk_people (
  email        text primary key check (email = lower(btrim(email)) and email like '%@%'),
  name         text not null check (btrim(name) <> ''),
  team_id      text references public.wk_teams(id) on update cascade,
  role         text not null default 'member' check (role in ('member','leader')),
  is_admin     boolean not null default false,
  is_registrar boolean not null default false,
  active       boolean not null default true,
  must_change  boolean not null default true,          -- 0426 그대로면 true
  color        int,
  my_lists     jsonb,                                  -- 내 목록 (null 이면 팀 기본 목록)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists wk_people_team_idx on public.wk_people(team_id);

create table if not exists public.wk_items (
  id          text primary key,
  team_id     text not null,
  owner_email text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists wk_items_team_idx  on public.wk_items(team_id);
create index if not exists wk_items_owner_idx on public.wk_items(owner_email);

create table if not exists public.wk_notices (
  id           text primary key,
  scope        text not null,                          -- 'all' = 전체 공지, 그 외 = 팀 id
  title        text not null,
  body         text not null default '',
  popup        boolean not null default true,
  active       boolean not null default true,
  author_email text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists wk_notices_scope_idx on public.wk_notices(scope);

-- 로그인 실패 횟수·잠금. 화면에서는 직접 읽고 쓸 수 없고 서버 함수만 씁니다.
create table if not exists public.wk_auth_state (
  email      text primary key,
  auth_uid   uuid,
  fails      int not null default 0,
  lock_until timestamptz,
  last_login timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- 현재 로그인한 사람 ----------
create or replace function public.wk_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt()->>'email','')) $$;

-- 비밀번호를 6자리로 바꾸고 재직 중인 사람만 true
create or replace function public.wk_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from wk_people where email = wk_email() and active and not must_change) $$;

create or replace function public.wk_my_team() returns text
language sql stable security definer set search_path = public as $$
  select team_id from wk_people where email = wk_email() and active and not must_change $$;

create or replace function public.wk_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from wk_people where email = wk_email() and active and not must_change and is_admin) $$;

create or replace function public.wk_is_registrar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from wk_people where email = wk_email() and active and not must_change and (is_registrar or is_admin)) $$;

create or replace function public.wk_is_leader() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from wk_people where email = wk_email() and active and not must_change and role = 'leader') $$;

-- 화면(로그인한 사용자)에서 온 요청인지. 서버 함수(service_role)와 SQL Editor 는 false
create or replace function public.wk_from_client() returns boolean
language sql stable as $$ select coalesce(auth.jwt()->>'role','') in ('authenticated','anon') $$;

-- ---------- 보호 장치 (화면에서 바꾸면 안 되는 값) ----------
create or replace function public.wk_people_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  new.email := lower(btrim(new.email));
  new.name  := btrim(new.name);
  new.updated_at := now();
  if not wk_from_client() then return new; end if;   -- 서버 함수·SQL Editor 는 통과
  if tg_op = 'INSERT' then
    new.must_change := true;
    if not wk_is_admin() then new.is_admin := false; new.is_registrar := false; end if;
  else
    if new.email <> old.email then raise exception 'email_locked' using hint = '메일은 바꿀 수 없어요. 새로 등록해 주세요.'; end if;
    new.must_change := old.must_change;
    if not wk_is_admin() then
      if old.is_admin then raise exception 'admin_protected' using hint = '관리자 정보는 관리자만 바꿀 수 있어요.'; end if;
      new.is_admin := old.is_admin; new.is_registrar := old.is_registrar;
    end if;
    if old.email = wk_email() and old.is_admin and not new.is_admin then
      raise exception 'self_admin' using hint = '내 관리자 권한은 스스로 뺄 수 없어요.';
    end if;
    if old.email = wk_email() and not new.active then
      raise exception 'self_inactive' using hint = '나를 퇴사 처리할 수는 없어요.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists wk_people_guard on public.wk_people;
create trigger wk_people_guard before insert or update on public.wk_people
  for each row execute function public.wk_people_guard();

create or replace function public.wk_items_guard() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and wk_from_client() then
    new.team_id := old.team_id; new.owner_email := old.owner_email;  -- 담당자·팀은 옮길 수 없음
  end if;
  return new;
end $$;
drop trigger if exists wk_items_guard on public.wk_items;
create trigger wk_items_guard before insert or update on public.wk_items
  for each row execute function public.wk_items_guard();

create or replace function public.wk_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists wk_notices_touch on public.wk_notices;
create trigger wk_notices_touch before update on public.wk_notices for each row execute function public.wk_touch();
drop trigger if exists wk_teams_touch on public.wk_teams;
create trigger wk_teams_touch before update on public.wk_teams for each row execute function public.wk_touch();

-- ---------- 권한 (RLS) ----------
alter table public.wk_teams      enable row level security;
alter table public.wk_people     enable row level security;
alter table public.wk_items      enable row level security;
alter table public.wk_notices    enable row level security;
alter table public.wk_auth_state enable row level security;   -- 정책 없음 = 화면에서 접근 불가

drop policy if exists "teams read"  on public.wk_teams;
drop policy if exists "teams write" on public.wk_teams;
create policy "teams read"  on public.wk_teams for select to authenticated using (wk_ok());
create policy "teams write" on public.wk_teams for all    to authenticated using (wk_is_admin()) with check (wk_is_admin());

drop policy if exists "people read"   on public.wk_people;
drop policy if exists "people insert" on public.wk_people;
drop policy if exists "people update" on public.wk_people;
drop policy if exists "people delete" on public.wk_people;
create policy "people read" on public.wk_people for select to authenticated
  using (email = wk_email() or wk_is_registrar() or (wk_ok() and team_id = wk_my_team()));
create policy "people insert" on public.wk_people for insert to authenticated with check (wk_is_registrar());
create policy "people update" on public.wk_people for update to authenticated using (wk_is_registrar()) with check (wk_is_registrar());
create policy "people delete" on public.wk_people for delete to authenticated
  using (wk_is_registrar() and email <> wk_email() and (wk_is_admin() or not is_admin));

drop policy if exists "items read"   on public.wk_items;
drop policy if exists "items insert" on public.wk_items;
drop policy if exists "items update" on public.wk_items;
drop policy if exists "items delete" on public.wk_items;
create policy "items read" on public.wk_items for select to authenticated
  using (wk_ok() and (wk_is_admin() or team_id = wk_my_team() or owner_email = wk_email()));
create policy "items insert" on public.wk_items for insert to authenticated
  with check (wk_ok() and owner_email = wk_email() and team_id = wk_my_team());
create policy "items update" on public.wk_items for update to authenticated
  using (wk_ok() and owner_email = wk_email()) with check (owner_email = wk_email());
create policy "items delete" on public.wk_items for delete to authenticated
  using (wk_ok() and owner_email = wk_email());

drop policy if exists "notices read"  on public.wk_notices;
drop policy if exists "notices write" on public.wk_notices;
create policy "notices read" on public.wk_notices for select to authenticated
  using (wk_ok() and (scope = 'all' or scope = wk_my_team() or wk_is_admin()));
create policy "notices write" on public.wk_notices for all to authenticated
  using (wk_ok() and ((scope = 'all' and wk_is_admin()) or (scope = wk_my_team() and wk_is_leader())))
  with check (wk_ok() and ((scope = 'all' and wk_is_admin()) or (scope = wk_my_team() and wk_is_leader())));

-- ---------- 화면에서 부르는 함수 ----------
-- 내 색·내 목록 저장 (본인 것만, 같은 팀에서 색 중복 불가)
create or replace function public.wk_set_my_prefs(p_color int default null, p_lists jsonb default null, p_clear_color boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare me wk_people;
begin
  select * into me from wk_people where email = wk_email() and active and not must_change;
  if me.email is null then raise exception 'not_allowed'; end if;
  if p_color is not null then
    if exists(select 1 from wk_people where team_id = me.team_id and active and color = p_color and email <> me.email) then
      raise exception 'color_taken' using hint = '같은 팀의 다른 사람이 쓰는 색이에요.';
    end if;
    update wk_people set color = p_color where email = me.email;
  elsif p_clear_color then
    update wk_people set color = null where email = me.email;
  end if;
  if p_lists is not null then update wk_people set my_lists = p_lists where email = me.email; end if;
end $$;

-- 관리 화면: 로그인 상태 (처음 비밀번호/잠김/마지막 접속)
create or replace function public.wk_auth_overview()
returns table(email text, fails int, lock_until timestamptz, last_login timestamptz, has_login boolean)
language sql stable security definer set search_path = public as $$
  select s.email, s.fails, s.lock_until, s.last_login, s.auth_uid is not null
  from wk_auth_state s where wk_is_registrar() $$;

-- 관리 화면: 잠금 풀기
create or replace function public.wk_unlock(p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not wk_is_registrar() then raise exception 'not_allowed'; end if;
  update wk_auth_state set fails = 0, lock_until = null, updated_at = now() where email = lower(btrim(p_email));
end $$;

-- 관리 화면(관리자): 지금 쓰는 화면(weekly_items)의 업무를 새 구조로 가져오기
--   p_src: 예전 팀 구분값 (예: 'quality'),  p_team: 새 팀 id
--   p_dry: true 면 저장하지 않고 결과만 확인,  p_reset: true 면 그 팀의 새 구조 업무를 비우고 다시 가져옴
create or replace function public.wk_import_legacy(p_src text, p_team text, p_dry boolean default true, p_reset boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r record; em text; n_items int := 0; n_sample int := 0; unmatched text[] := '{}';
  cfg jsonb; ncfg jsonb; n_notice int := 0; nm text; ci int;
begin
  if wk_from_client() and not wk_is_admin() then raise exception 'not_allowed'; end if;
  if not exists(select 1 from wk_teams where id = p_team) then raise exception 'no_team'; end if;
  if to_regclass('public.weekly_items') is null then raise exception 'no_legacy' using hint = '가져올 예전 표(weekly_items)가 없어요.'; end if;

  if p_reset and not p_dry then delete from wk_items where team_id = p_team; end if;

  for r in execute 'select id, data from public.weekly_items where team = $1' using p_src loop
    if coalesce((r.data->>'sample')::boolean, false) then n_sample := n_sample + 1; continue; end if;
    select email into em from wk_people where team_id = p_team and name = btrim(r.data->>'owner') order by active desc, email limit 1;
    if em is null and not (coalesce(r.data->>'owner','') = any(unmatched)) then unmatched := unmatched || coalesce(r.data->>'owner',''); end if;
    n_items := n_items + 1;
    if not p_dry then
      insert into wk_items(id, team_id, owner_email, data) values (p_src || '-' || r.id, p_team, em, r.data)
      on conflict (id) do update set team_id = excluded.team_id, owner_email = excluded.owner_email, data = excluded.data;
    end if;
  end loop;

  if to_regclass('public.weekly_config') is not null then
    execute 'select data from public.weekly_config where team = $1' into cfg using p_src;
    execute 'select data from public.weekly_config where team = $1' into ncfg using p_src || '-notice';
  end if;
  if not p_dry and cfg is not null then
    update wk_teams set lists = jsonb_strip_nulls(jsonb_build_object(
      'customers', cfg->'customers', 'vendors', cfg->'vendors', 'cats', cfg->'cats')) where id = p_team;
    if jsonb_typeof(cfg->'colors') = 'object' then
      for nm, ci in select key, (value)::text::int from jsonb_each(cfg->'colors') where jsonb_typeof(value) = 'number' loop
        update wk_people set color = ci where team_id = p_team and name = nm and color is null
          and not exists(select 1 from wk_people q where q.team_id = p_team and q.color = ci);
      end loop;
    end if;
  end if;
  if ncfg is not null then
    for r in select value as n from jsonb_array_elements(case when jsonb_typeof(ncfg->'list') = 'array' then ncfg->'list'
                                                           when ncfg ? 'title' then jsonb_build_array(ncfg) else '[]'::jsonb end) loop
      if coalesce((r.n->>'active')::boolean, true) and coalesce(r.n->>'title','') <> '' then
        n_notice := n_notice + 1;
        if not p_dry then
          insert into wk_notices(id, scope, title, body, popup, active, created_at, updated_at)
          values (p_src || '-' || coalesce(r.n->>'id', md5(r.n::text)), p_team, r.n->>'title', coalesce(r.n->>'body',''),
                  coalesce((r.n->>'popup')::boolean, true), true,
                  coalesce((r.n->>'createdAt')::timestamptz, (r.n->>'updatedAt')::timestamptz, now()),
                  coalesce((r.n->>'updatedAt')::timestamptz, now()))
          on conflict (id) do update set title = excluded.title, body = excluded.body, popup = excluded.popup;
        end if;
      end if;
    end loop;
  end if;

  return jsonb_build_object('items', n_items, 'samples_skipped', n_sample, 'unmatched', to_jsonb(unmatched),
                            'notices', n_notice, 'lists', cfg is not null, 'dry', p_dry);
end $$;

revoke all on function public.wk_import_legacy(text,text,boolean,boolean) from public, anon;
revoke all on function public.wk_set_my_prefs(int,jsonb,boolean) from public, anon;
revoke all on function public.wk_auth_overview() from public, anon;
revoke all on function public.wk_unlock(text) from public, anon;
grant execute on function public.wk_import_legacy(text,text,boolean,boolean) to authenticated;
grant execute on function public.wk_set_my_prefs(int,jsonb,boolean) to authenticated;
grant execute on function public.wk_auth_overview() to authenticated;
grant execute on function public.wk_unlock(text) to authenticated;
revoke all on public.wk_auth_state from anon, authenticated;
