-- Store exact claim time to support per-bonus 24h cooldowns.
alter table public.user_claims
  add column if not exists claimed_at timestamptz not null default now();

create index if not exists user_claims_user_casino_claimed_at_idx
  on public.user_claims (user_id, casino_id, claimed_at desc);