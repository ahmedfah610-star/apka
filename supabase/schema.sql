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
  stan integer,               -- łączny stan (suma po rozmiarach); null = bez limitu, 0 = brak
  stan_rozmiary jsonb,        -- stan per rozmiar: {"104": 3, "110": 0, ...}; null = brak podziału
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
  klient jsonb,
  status text not null default 'nowe',   -- nowe | oczekuje_na_platnosc | oplacone | wyslane | anulowane
  platnosc_id text                        -- id sesji płatności (Stripe)
);
-- Migracja istniejącej tabeli (gdy zakładana wcześniej bez tych kolumn):
alter table zamowienia add column if not exists status text not null default 'nowe';
alter table zamowienia add column if not exists platnosc_id text;

-- Zapisy do newslettera.
create table if not exists newsletter (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Zgłoszenia "powiadom, gdy produkt/rozmiar znów dostępny".
create table if not exists powiadomienia_dostepnosc (
  id uuid primary key default gen_random_uuid(),
  produkt_id text not null,
  rozmiar text,
  email text not null,
  powiadomiony boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_powiad_produkt on powiadomienia_dostepnosc (produkt_id) where not powiadomiony;

-- RLS: sklep czyta produkty publicznie; zapisy tylko przez service role (panel).
alter table produkty enable row level security;
drop policy if exists "public read produkty" on produkty;
create policy "public read produkty" on produkty for select using (true);

alter table zamowienia enable row level security;
-- brak publicznych polityk na zamowienia (dostęp tylko service role z serwera)

alter table newsletter enable row level security;
alter table powiadomienia_dostepnosc enable row level security;
-- brak publicznych polityk — zapisy idą przez service role z endpointów /api

-- Atomowe złożenie zamówienia + zdjęcie stanu (transakcyjnie), per rozmiar.
create or replace function zloz_zamowienie(
  p_pozycje jsonb, p_suma numeric, p_dostawa numeric, p_razem numeric, p_metoda text, p_klient jsonb
) returns uuid language plpgsql security definer as $$
declare poz jsonb; nowe_id uuid; v_rozmiar text; v_ilosc int; v_sr jsonb; v_akt int;
begin
  insert into zamowienia(pozycje, suma, dostawa, razem, metoda, klient)
  values (p_pozycje, p_suma, p_dostawa, p_razem, p_metoda, p_klient) returning id into nowe_id;
  for poz in select * from jsonb_array_elements(p_pozycje) loop
    v_rozmiar := poz->>'rozmiar';
    v_ilosc := coalesce((poz->>'ilosc')::int, 0);
    -- odejmij od konkretnego rozmiaru (jeśli produkt ma podział i rozmiar podany)
    if v_rozmiar is not null and v_rozmiar <> '' then
      select stan_rozmiary into v_sr from produkty where id = poz->>'id';
      if v_sr is not null and v_sr ? v_rozmiar then
        v_akt := greatest(0, coalesce((v_sr->>v_rozmiar)::int, 0) - v_ilosc);
        update produkty
          set stan_rozmiary = jsonb_set(stan_rozmiary, array[v_rozmiar], to_jsonb(v_akt)),
              stan = greatest(0, coalesce(stan,0) - v_ilosc)
          where id = poz->>'id';
        continue;
      end if;
    end if;
    -- fallback: produkt bez podziału na rozmiary
    update produkty
      set stan = greatest(0, stan - v_ilosc)
      where id = poz->>'id' and stan is not null;
  end loop;
  return nowe_id;
end $$;

-- Oznaczenie zamówienia jako opłacone + zdjęcie stanu (dla płatności online).
-- Idempotentne: jeśli zamówienie było już opłacone, nic nie odejmuje ponownie.
create or replace function oplac_zamowienie(p_id uuid) returns void language plpgsql security definer as $$
declare poz jsonb; v_pozycje jsonb; v_rozmiar text; v_ilosc int; v_sr jsonb; v_akt int;
begin
  update zamowienia set status = 'oplacone'
    where id = p_id and status <> 'oplacone'
    returning pozycje into v_pozycje;
  if v_pozycje is null then return; end if;  -- brak zmiany = już opłacone
  for poz in select * from jsonb_array_elements(v_pozycje) loop
    v_rozmiar := poz->>'rozmiar';
    v_ilosc := coalesce((poz->>'ilosc')::int, 0);
    if v_rozmiar is not null and v_rozmiar <> '' then
      select stan_rozmiary into v_sr from produkty where id = poz->>'id';
      if v_sr is not null and v_sr ? v_rozmiar then
        v_akt := greatest(0, coalesce((v_sr->>v_rozmiar)::int, 0) - v_ilosc);
        update produkty
          set stan_rozmiary = jsonb_set(stan_rozmiary, array[v_rozmiar], to_jsonb(v_akt)),
              stan = greatest(0, coalesce(stan,0) - v_ilosc)
          where id = poz->>'id';
        continue;
      end if;
    end if;
    update produkty set stan = greatest(0, stan - v_ilosc) where id = poz->>'id' and stan is not null;
  end loop;
end $$;
