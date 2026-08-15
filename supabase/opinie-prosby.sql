-- bobas-shopping — flaga wysłanej prośby o opinię (mail „oceń zakup").
-- Uruchom w Supabase → SQL Editor.
alter table zamowienia add column if not exists opinia_wyslana boolean not null default false;
