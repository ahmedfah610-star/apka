-- Fasolka — schemat bazy (Supabase / Postgres)

create table if not exists produkty (
  id text primary key,
  nazwa text not null,
  cena numeric not null default 0,
  kategoria text not null,
  wiek text not null,
  wiek_label text not null,
  badge text,
  rozmiary text[] not null default '{}',
  zdjecie text,
  zdjecia text[] not null default '{}',
  opis text,
  stan integer,               -- null = dostępny bez limitu, 0 = brak
  ukryty boolean not null default false,
  hue integer not null default 30,
  created_at timestamptz not null default now()
);

create table if not exists zamowienia (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pozycje jsonb not null,
  suma numeric not null,
  dostawa numeric not null,
  razem numeric not null,
  metoda text,
  klient jsonb
);

-- RLS: sklep czyta produkty publicznie; zapisy tylko przez service role (panel).
alter table produkty enable row level security;
drop policy if exists "public read produkty" on produkty;
create policy "public read produkty" on produkty for select using (true);

alter table zamowienia enable row level security;
-- brak publicznych polityk na zamowienia (dostęp tylko service role z serwera)

-- Atomowe złożenie zamówienia + zdjęcie stanu (transakcyjnie).
create or replace function zloz_zamowienie(
  p_pozycje jsonb, p_suma numeric, p_dostawa numeric, p_razem numeric, p_metoda text, p_klient jsonb
) returns uuid language plpgsql security definer as $$
declare poz jsonb; nowe_id uuid;
begin
  insert into zamowienia(pozycje, suma, dostawa, razem, metoda, klient)
  values (p_pozycje, p_suma, p_dostawa, p_razem, p_metoda, p_klient) returning id into nowe_id;
  for poz in select * from jsonb_array_elements(p_pozycje) loop
    update produkty
      set stan = greatest(0, stan - (poz->>'ilosc')::int)
      where id = poz->>'id' and stan is not null;
  end loop;
  return nowe_id;
end $$;
