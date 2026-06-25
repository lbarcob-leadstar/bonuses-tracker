-- Add expandable welcome offer info per casino
alter table public.casinos
  add column if not exists welcome_offer_info text;

-- Persist per-user favorite casinos
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  casino_id uuid not null references public.casinos on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, casino_id)
);

alter table public.user_favorites enable row level security;

create policy "Users manage own favorites"
  on public.user_favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);