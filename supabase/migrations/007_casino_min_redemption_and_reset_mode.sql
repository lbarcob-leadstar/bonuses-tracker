alter table public.casinos
  add column if not exists min_redemption numeric,
  add column if not exists reset_at_midnight boolean not null default false;