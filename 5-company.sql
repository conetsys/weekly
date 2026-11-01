-- =====================================================================
-- rhy:se · 회사 설정 + 첫 설정 화면
-- Supabase > SQL Editor 에 전체를 붙여넣고 Run. 여러 번 실행해도 안전합니다.
--  1) 회사 설정 표: 회사 이름 · 로고 · 메일 도메인 · 보고서 팀 탭 · 보고서 배경
--     (로그인 전에도 화면에 보여야 해서 누구나 읽을 수 있고, 바꾸기는 관리자만)
--  2) 첫 설정: 관리자가 한 명도 없을 때만 로그인 화면 아래 '새로운 관리자' 버튼이 보이고,
--     미리 넣어 둔 정보(고객사_준비.sql)로 회사·첫 팀·첫 관리자를 만듦
-- =====================================================================
create table if not exists public.wk_company (
  id           int primary key default 1 check (id = 1),   -- 한 줄만
  name         text not null default '',
  mail_domain  text not null default '',
  logo         text,                                         -- 어두운 바탕용(흰색) 로고, 그림 데이터
  report_depts jsonb not null default '[]'::jsonb,           -- 보고서 위쪽 팀 탭
  report_bg    text,                                         -- 보고서 배경 그림 (없으면 기본)
  setup        jsonb,                                        -- 미리 넣어 둔 첫 설정 정보 {team,name,email}. 설정이 끝나면 지워짐
  updated_by   text,
  updated_at   timestamptz not null default now()
);
alter table public.wk_company add column if not exists setup jsonb;
alter table public.wk_company enable row level security;
grant select on public.wk_company to anon, authenticated;
grant insert, update on public.wk_company to authenticated;

drop policy if exists "company read"  on public.wk_company;
drop policy if exists "company write" on public.wk_company;
drop policy if exists "company insert" on public.wk_company;
create policy "company read" on public.wk_company for select to anon, authenticated using (true);
create policy "company write" on public.wk_company for update to authenticated
  using (wk_ok() and wk_is_admin()) with check (wk_ok() and wk_is_admin());
create policy "company insert" on public.wk_company for insert to authenticated
  with check (wk_ok() and wk_is_admin());

-- 지금 회사(CONET SYS) 기본값. 이미 있으면 그대로 둠
insert into public.wk_company (id, name, mail_domain, report_depts)
values (1, 'CONET SYS', 'conet-sys.co.kr',
  '["영업","구매","생산기술","가공","연구소","생산본부","원가관리","고객품질","구미기술","경영지원"]'::jsonb)
on conflict (id) do nothing;

-- ---------- 첫 설정 ----------
-- 사람 보호 장치에 '첫 설정 중' 통과 조건 추가 (나머지는 그대로)
create or replace function public.wk_people_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  new.email := lower(btrim(new.email));
  new.name  := btrim(new.name);
  new.updated_at := now();
  if not wk_from_client() then return new; end if;   -- 서버 함수·SQL Editor 는 통과
  if coalesce(current_setting('wk.bootstrap', true), '') = '1' then return new; end if;  -- 첫 설정 함수 안에서만
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

-- 관리자가 한 명도 없으면 true (로그인 전 화면에서 첫 설정을 보여줄지 판단)
create or replace function public.wk_setup_needed() returns boolean
language sql stable security definer set search_path = public as $$
  select not exists(select 1 from wk_people where is_admin and active) $$;

-- 첫 설정: 회사 · 첫 팀 · 첫 관리자 만들기. 관리자가 이미 있으면 거절
create or replace function public.wk_bootstrap(p_company text, p_domain text, p_team text, p_name text, p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare tid text; em text := lower(btrim(p_email)); dom text := lower(btrim(coalesce(p_domain,'')));
begin
  if exists(select 1 from wk_people where is_admin and active) then
    raise exception 'already_setup' using hint = '이미 설정이 끝났어요. 관리자에게 문의해 주세요.';
  end if;
  if btrim(coalesce(p_company,'')) = '' or btrim(coalesce(p_team,'')) = '' or btrim(coalesce(p_name,'')) = '' then
    raise exception 'missing' using hint = '회사 이름, 첫 팀 이름, 관리자 이름을 모두 적어 주세요.';
  end if;
  if dom <> '' and position('@' in em) = 0 then em := em || '@' || dom; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'bad_email' using hint = '관리자 메일 주소를 확인해 주세요.'; end if;
  perform set_config('wk.bootstrap', '1', true);
  insert into wk_company (id, name, mail_domain) values (1, btrim(p_company), dom)
  on conflict (id) do update set name = excluded.name, mail_domain = excluded.mail_domain, setup = null, updated_at = now();
  select id into tid from wk_teams where name = btrim(p_team) limit 1;
  if tid is null then
    tid := 't' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    insert into wk_teams (id, name, sort) values (tid, btrim(p_team), 10);
  end if;
  insert into wk_people (email, name, team_id, role, is_admin, is_registrar, active, must_change)
  values (em, btrim(p_name), tid, 'leader', true, true, true, true)
  on conflict (email) do update set name = excluded.name, team_id = excluded.team_id, is_admin = true, is_registrar = true, active = true, must_change = true;
  perform set_config('wk.bootstrap', '', true);
  return em;
end $$;

revoke all on function public.wk_setup_needed() from public;
revoke all on function public.wk_bootstrap(text,text,text,text,text) from public;
grant execute on function public.wk_setup_needed() to anon, authenticated;
grant execute on function public.wk_bootstrap(text,text,text,text,text) to anon, authenticated;
