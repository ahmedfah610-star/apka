-- bobas-shopping — wysyłka i śledzenie przesyłek.
-- Dodaje do zamówień numer listu przewozowego i przewoźnika, aby panel
-- mógł oznaczyć paczkę jako nadaną i wysłać klientowi link do śledzenia.
-- Uruchom w Supabase → SQL Editor (po schema.sql).

alter table zamowienia add column if not exists numer_przesylki text;
alter table zamowienia add column if not exists przewoznik text;
alter table zamowienia add column if not exists wyslano_at timestamptz;
