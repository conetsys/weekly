-- =====================================================================
-- 주간 업무 · 로그인 버전 — Supabase 설정 2/2 : 첫 팀과 첫 관리자
-- 아래 두 줄의 '관리자메일@회사.com' 과 '관리자이름' 을 본인 것으로 바꾼 뒤 Run.
-- 관리자는 처음 로그인할 때 비밀번호 0426 → 숫자 6자리로 바꿉니다.
-- =====================================================================
insert into public.wk_teams (id, name, sort) values ('quality', '고객품질팀', 10)
on conflict (id) do nothing;

insert into public.wk_people (email, name, team_id, role, is_admin, is_registrar)
values (lower('관리자메일@회사.com'), '관리자이름', 'quality', 'member', true, true)
on conflict (email) do update set is_admin = true, is_registrar = true, active = true;
