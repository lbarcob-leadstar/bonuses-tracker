alter table public.casinos
  add column if not exists logo_url text,
  add column if not exists casino_url text;

