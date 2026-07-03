create table if not exists public.featured_bonuses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  background_image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.featured_bonuses enable row level security;

create policy "Authenticated users can read active featured bonuses"
  on public.featured_bonuses for select
  to authenticated
  using (is_active = true);

create policy "Admins can manage featured bonuses"
  on public.featured_bonuses for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );