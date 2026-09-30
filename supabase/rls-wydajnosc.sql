-- bobas-shopping — polityki RLS z (select auth.…()) zamiast auth.…() liczonego dla każdego wiersza
-- (zalecenie doradcy Supabase „auth_rls_initplan"). Zastosowane 2026-09-30.
alter policy "auth read own orders" on public.zamowienia using (lower(klient ->> 'email') = lower((select auth.email())));
alter policy "own konto_dane sel" on public.konto_dane using (user_id = (select auth.uid()));
alter policy "own konto_dane ins" on public.konto_dane with check (user_id = (select auth.uid()));
alter policy "own konto_dane upd" on public.konto_dane using (user_id = (select auth.uid()));
