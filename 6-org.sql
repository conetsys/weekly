-- =====================================================================
-- rhy:se · 조직도 (v3.1.0)
-- Supabase > SQL Editor 에 전체를 붙여넣고 Run. 여러 번 실행해도 안전합니다.
--  · 조직 표(wk_units): 회사마다 다른 구조를 자유롭게 (사업부 > 실 > 팀 > 파트 …)
--      parent_id 가 비어 있으면 대표이사 바로 아래
--      team_id 가 있으면 '주간업무 팀' (그 팀의 업무·보고서를 함께 씀)
--  · 사람에 정확한 소속 조직(unit_id)과 직책(title) 칸 추가
--  · 회사 설정에 대표이사(ceo) · 임원(execs) · 조직 종류(org_levels) · 직책 목록(titles) 칸 추가
--  업무·보고서 권한은 그대로입니다 (조직도는 관리자 화면에서만 보고 고침).
-- =====================================================================
create table if not exists public.wk_units (
  id          text primary key,
  name        text not null check (btrim(name) <> ''),
  level       text not null default '',                 -- 조직 종류 (예: 본부, 실, 팀, 파트)
  parent_id   text references public.wk_units(id) on update cascade on delete set null,
  sort        int  not null default 100,
  head        jsonb,                                    -- 조직장 {email, name, title}
  team_id     text unique references public.wk_teams(id) on update cascade on delete set null,
  updated_at  timestamptz not null default now()
);
create index if not exists wk_units_parent_idx on public.wk_units(parent_id);
alter table public.wk_units enable row level security;
grant select, insert, update, delete on public.wk_units to authenticated;
drop policy if exists "units read"  on public.wk_units;
drop policy if exists "units write" on public.wk_units;
create policy "units read"  on public.wk_units for select to authenticated using (wk_ok());
create policy "units write" on public.wk_units for all    to authenticated
  using (wk_ok() and wk_is_admin()) with check (wk_ok() and wk_is_admin());

alter table public.wk_people  add column if not exists title      text;
alter table public.wk_people  add column if not exists unit_id    text references public.wk_units(id) on update cascade on delete set null;
alter table public.wk_company add column if not exists ceo        jsonb;   -- 대표이사 {name, title, email}
alter table public.wk_company add column if not exists execs      jsonb;   -- 임원 [{name, title, email}]
alter table public.wk_company add column if not exists org_levels jsonb;   -- 조직 종류 [{name, head, work}]
alter table public.wk_company add column if not exists titles     jsonb;   -- 직책 목록 ["대표이사", "팀장", …]
