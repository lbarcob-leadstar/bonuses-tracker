create table public.landing_blocks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('heading', 'text', 'image')),
  heading_level text check (heading_level in ('h2', 'h3', 'h4')),
  content text,
  image_url text,
  image_alt text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.landing_blocks enable row level security;

create policy "Public can read active landing blocks"
  on public.landing_blocks for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage landing blocks"
  on public.landing_blocks for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
