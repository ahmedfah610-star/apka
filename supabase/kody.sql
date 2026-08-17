-- bobas-shopping — kody rabatowe.
-- Sprzedawca tworzy kody (procentowe lub kwotowe), klient wpisuje je w koszyku.
-- Walidacja i naliczanie rabatu odbywa się po stronie serwera (checkout).
-- Uruchom w Supabase → SQL Editor.

create table if not exists kody_rabatowe (
  kod text primary key,                    -- zapisywany wielkimi literami
  typ text not null check (typ in ('procent', 'kwota')),
  wartosc numeric not null check (wartosc > 0),
  min_koszyk numeric not null default 0,   -- minimalna wartość koszyka, aby kod działał
  aktywny boolean not null default true,
  wazny_do timestamptz,                    -- null = bezterminowo
  limit_uzyc integer,                      -- null = bez limitu
  uzyto integer not null default 0,
  created_at timestamptz not null default now()
);

alter table kody_rabatowe enable row level security;
-- brak publicznych polityk — dostęp wyłącznie przez service role z endpointów /api

-- Atomowa inkrementacja licznika użyć (wywoływana po opłaceniu zamówienia z kodem).
create or replace function uzyj_kodu(p_kod text) returns void language sql security definer as $$
  update kody_rabatowe set uzyto = uzyto + 1 where kod = upper(p_kod);
$$;

-- Zapamiętanie użytego kodu i kwoty rabatu przy zamówieniu.
alter table zamowienia add column if not exists kod_rabatowy text;
alter table zamowienia add column if not exists rabat numeric not null default 0;
