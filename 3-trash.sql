-- =====================================================================
-- 주간 업무 · 휴지통 (실수로 지운 업무·사람을 되살리기)
-- Supabase > SQL Editor 에 전체를 붙여넣고 Run. 여러 번 실행해도 안전합니다.
-- 화면에서 업무를 삭제하거나 사람 등록을 취소하면, 지우기 직전 내용이 여기에 자동으로 남습니다.
-- 팀원에게는 보이지 않고, 관리자만 '관리 → 휴지통'에서 보고 되살릴 수 있어요.
-- =====================================================================
create table if not exists public.wk_trash (
  id          bigserial primary key,
  tbl         text not null,                 -- 'wk_items' 또는 'wk_people'
  row_id      text not null,                 -- 지운 업무 id 또는 메일
  team_id     text,
  data        jsonb not null,                -- 지우기 직전 한 줄 전체
  deleted_by  text,
  deleted_at  timestamptz not null default now(),
  restored_at timestamptz
);
create index if not exists wk_trash_time_idx on public.wk_trash(deleted_at desc);
alter table public.wk_trash enable row level security;      -- 정책 없음 = 화면에서 직접 읽기·쓰기 불가
revoke all on public.wk_trash from anon, authenticated;

create or replace function public.wk_to_trash() returns trigger
language plpgsql security definer set search_path = public as $$
declare o jsonb := to_jsonb(old);
begin
  insert into wk_trash(tbl, row_id, team_id, data, deleted_by)
  values (tg_table_name, coalesce(o->>'id', o->>'email'), o->>'team_id', o, nullif(wk_email(), ''));
  return old;
end $$;

drop trigger if exists wk_items_trash on public.wk_items;
create trigger wk_items_trash after delete on public.wk_items for each row execute function public.wk_to_trash();
drop trigger if exists wk_people_trash on public.wk_people;
create trigger wk_people_trash after delete on public.wk_people for each row execute function public.wk_to_trash();

-- 관리자: 휴지통 보기 (최근 것부터)
create or replace function public.wk_trash_list(p_limit int default 200)
returns table(id bigint, tbl text, row_id text, team_id text, data jsonb, deleted_by text, deleted_at timestamptz, restored_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.tbl, t.row_id, t.team_id, t.data, t.deleted_by, t.deleted_at, t.restored_at
  from wk_trash t where wk_is_admin() order by t.deleted_at desc limit greatest(1, least(p_limit, 1000)) $$;

-- 관리자: 되살리기 (같은 id·메일이 이미 있으면 되살리지 않음)
create or replace function public.wk_trash_restore(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare t wk_trash;
begin
  if not wk_is_admin() then raise exception 'not_allowed'; end if;
  select * into t from wk_trash where id = p_id;
  if t.id is null then raise exception 'no_trash'; end if;
  if t.restored_at is not null then raise exception 'already_restored' using hint = '이미 되살린 항목이에요.'; end if;
  if t.tbl = 'wk_items' then
    if exists(select 1 from wk_items where id = t.row_id) then raise exception 'exists' using hint = '같은 업무가 이미 있어요.'; end if;
    insert into wk_items(id, team_id, owner_email, data)
    values (t.row_id, t.data->>'team_id', t.data->>'owner_email', t.data->'data');
  elsif t.tbl = 'wk_people' then
    if exists(select 1 from wk_people where email = t.row_id) then raise exception 'exists' using hint = '같은 메일로 이미 등록돼 있어요.'; end if;
    insert into wk_people select * from jsonb_populate_record(null::wk_people, t.data);
  end if;
  update wk_trash set restored_at = now() where id = p_id;
  return t.row_id;
end $$;

revoke all on function public.wk_trash_list(int) from public, anon;
revoke all on function public.wk_trash_restore(bigint) from public, anon;
grant execute on function public.wk_trash_list(int) to authenticated;
grant execute on function public.wk_trash_restore(bigint) to authenticated;
