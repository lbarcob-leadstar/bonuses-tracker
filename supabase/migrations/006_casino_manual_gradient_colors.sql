alter table public.casinos
  add column if not exists logo_primary_color text,
  add column if not exists logo_secondary_color text;