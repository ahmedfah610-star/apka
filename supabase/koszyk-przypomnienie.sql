-- bobas-shopping — przypomnienie o porzuconym koszyku.
-- Znacznik ostatnio wysłanego przypomnienia dla zapisanego koszyka konta.
-- Gdy klient zmieni koszyk (zaktualizowano > przypomniano_at), znów kwalifikuje się do maila.
-- Uruchom w Supabase → SQL Editor (po konta.sql).

alter table konto_dane add column if not exists koszyk_przypomniano_at timestamptz;
