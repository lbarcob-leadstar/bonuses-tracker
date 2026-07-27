alter table public.casinos
  add column if not exists welcome_offer_show_cta boolean not null default false,
  add column if not exists welcome_offer_cta_text text,
  add column if not exists welcome_offer_cta_url text;