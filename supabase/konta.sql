-- bobas-shopping — konta klientów (Supabase Auth).
-- Uruchom w Supabase → SQL Editor (po schema.sql).
-- Wymaga włączonego dostawcy Email w Authentication + potwierdzania e-maila.

-- Historia zamówień dla zalogowanych: po zweryfikowanym e-mailu
-- (łapie też zamówienia złożone wcześniej jako gość na ten sam e-mail).
alter table zamowienia enable row level security;
drop policy if exists "auth read own orders" on zamowienia;
create policy "auth read own orders" on zamowienia
  for select to authenticated
  using (lower(klient->>'email') = lower(auth.email()));

-- Zapisany koszyk i ulubione (synchronizacja między urządzeniami).
create table if not exists konto_dane (
  user_id uuid primary key references auth.users(id) on delete cascade,
  koszyk jsonb not null default '[]',
  ulubione jsonb not null default '[]',
  zaktualizowano timestamptz not null default now()
);

alter table konto_dane enable row level security;
drop policy if exists "own konto_dane sel" on konto_dane;
drop policy if exists "own konto_dane ins" on konto_dane;
drop policy if exists "own konto_dane upd" on konto_dane;
create policy "own konto_dane sel" on konto_dane for select to authenticated using (user_id = auth.uid());
create policy "own konto_dane ins" on konto_dane for insert to authenticated with check (user_id = auth.uid());
create policy "own konto_dane upd" on konto_dane for update to authenticated using (user_id = auth.uid());
