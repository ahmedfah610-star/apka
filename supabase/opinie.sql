-- bobas-shopping — opinie o produktach (oceny + recenzje).
-- Uruchom w Supabase → SQL Editor (po schema.sql).

create table if not exists opinie (
  id uuid primary key default gen_random_uuid(),
  produkt_id text not null,
  imie text not null,
  ocena int not null check (ocena between 1 and 5),
  tresc text,
  zatwierdzona boolean not null default true,
  utworzono timestamptz not null default now()
);

create index if not exists opinie_produkt_idx on opinie (produkt_id);

-- RLS: publiczny odczyt zatwierdzonych opinii; zapisy tylko przez service role (API).
alter table opinie enable row level security;
drop policy if exists "public read opinie" on opinie;
create policy "public read opinie" on opinie for select using (zatwierdzona = true);
