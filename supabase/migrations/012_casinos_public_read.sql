-- Allow unauthenticated visitors to read active casino logo URLs
-- for the landing page animated background (no sensitive data exposed)
create policy "Public can read active casino logos"
  on public.casinos for select
  to anon
  using (is_active = true);
