-- bobas-shopping — import ofert z Allegro (oficjalne REST API).
-- Uruchom w Supabase → SQL Editor (po schema.sql).

-- Nowe pola produktu: kolor (z parametru Allegro) oraz identyfikator oferty
-- źródłowej (dedup i aktualizacja przy ponownym imporcie).
alter table produkty add column if not exists kolor text;
alter table produkty add column if not exists allegro_id text;
create unique index if not exists produkty_allegro_id_idx on produkty (allegro_id) where allegro_id is not null;

-- Token autoryzacji Allegro (Device Flow). Jeden wiersz (id=1).
-- Trzymamy refresh_token; access_token odnawiamy automatycznie.
create table if not exists allegro_auth (
  id smallint primary key default 1,
  refresh_token text,
  access_token text,
  expires_at timestamptz,
  konto text,                 -- login/e-mail konta Allegro (informacyjnie)
  zaktualizowano timestamptz not null default now(),
  constraint allegro_auth_jeden check (id = 1)
);

-- Dostęp wyłącznie przez service role (serwer). Bez publicznych polityk.
alter table allegro_auth enable row level security;
