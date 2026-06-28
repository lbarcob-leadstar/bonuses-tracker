alter table public.casinos
  add column if not exists sc_amount numeric,
  add column if not exists gc_amount numeric;

