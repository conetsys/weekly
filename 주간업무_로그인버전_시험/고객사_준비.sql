-- =====================================================================
-- rhy:se · 새 고객사 준비 (고객사 Supabase 프로젝트에서 실행)
-- 순서: 1 ~ 5 번 SQL 을 모두 실행한 뒤, 아래 ' ' 안의 값만 바꿔서 Run.
-- 고객사 관리자는 로그인 화면 아래 '새로운 관리자일 경우 눌러주세요'를 눌러
-- 이 정보를 확인하고 [설정 마치기] → 처음 비밀번호 0426 으로 로그인합니다.
-- (관리자가 생기면 그 버튼은 저절로 사라지고, 여기 넣은 준비 정보도 지워집니다)
-- =====================================================================
insert into public.wk_company (id, name, mail_domain, report_depts, setup)
values (1,
  '회사 이름',                 -- 예: ACME
  'company.com',               -- 회사 메일 @ 뒷부분
  '["영업","구매","생산","품질","경영지원"]'::jsonb,   -- 보고서 위쪽 팀 탭 (나중에 관리 → 회사에서 바꿀 수 있음)
  jsonb_build_object(
    'team',  '첫 팀 이름',      -- 예: 품질팀
    'name',  '관리자 이름',     -- 예: 홍길동
    'email', 'admin@company.com'
  ))
on conflict (id) do update set
  name = excluded.name, mail_domain = excluded.mail_domain,
  report_depts = excluded.report_depts, setup = excluded.setup, updated_at = now();
