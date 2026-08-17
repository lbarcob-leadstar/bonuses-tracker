create table public.landing_config (
  id uuid primary key default gen_random_uuid(),
  page_title text not null default 'United Gamblers Daily Bonus Tracker',
  meta_description text not null default 'Track all your sweepstakes casino daily bonuses in one place.',
  hero_badge text not null default 'Built for daily bonus grinders',
  hero_description text not null default 'United Gamblers Daily Bonus Tracker helps sweepstakes casino players track, claim and manage their daily bonuses across all major brands — all in one place. Claim faster, keep streaks alive, and monitor your daily progress.',
  updated_at timestamptz default now()
);

-- Only one row allowed
create unique index landing_config_single_row on public.landing_config ((true));

alter table public.landing_config enable row level security;

create policy "Public can read landing config"
  on public.landing_config for select
  to anon, authenticated
  using (true);

create policy "Admins can manage landing config"
  on public.landing_config for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

insert into public.landing_config (page_title, meta_description, hero_badge, hero_description)
values (
  'United Gamblers Daily Bonus Tracker',
  'Track all your sweepstakes casino daily bonuses in one place.',
  'Built for daily bonus grinders',
  'United Gamblers Daily Bonus Tracker helps sweepstakes casino players track, claim and manage their daily bonuses across all major brands — all in one place. Claim faster, keep streaks alive, and monitor your daily progress.'
);
