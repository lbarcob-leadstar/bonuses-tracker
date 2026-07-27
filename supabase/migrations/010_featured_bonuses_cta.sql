alter table public.featured_bonuses
  add column if not exists show_cta boolean not null default false,
  add column if not exists cta_text text,
  add column if not exists cta_url text;