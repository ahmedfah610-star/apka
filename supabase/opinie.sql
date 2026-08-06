-- bobas-shopping — opinie o produktach (oceny + recenzje).
-- Tylko klienci, którzy kupili dany produkt, mogą wystawić opinię
-- (weryfikacja po e-mailu z zamówienia odbywa się po stronie serwera).
-- Uruchom w Supabase → SQL Editor (po schema.sql).

create table if not exists opinie (
  id uuid primary key default gen_random_uuid(),
  produkt_id text not null,
  imie text not null,
  email text not null,
  ocena int not null check (ocena between 1 and 5),
  tresc text,
  zatwierdzona boolean not null default true,
  utworzono timestamptz not null default now()
);

create index if not exists opinie_produkt_idx on opinie (produkt_id);

-- Jedna opinia na produkt na klienta (e-mail).
create unique index if not exists opinie_produkt_email_idx on opinie (produkt_id, lower(email));

-- RLS: dostęp wyłącznie przez service role (serwer). E-mail klienta nie jest
-- nigdzie publicznie udostępniany — odczyt opinii idzie przez API bez pola e-mail.
alter table opinie enable row level security;
