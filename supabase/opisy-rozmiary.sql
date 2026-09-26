-- Opis per rozmiar: na Allegro każdy rozmiar to osobna oferta z własnymi
-- wymiarami („WZROST 92 CM, szerokość 24 cm…"). Po połączeniu rozmiarów w jeden
-- produkt trzymamy opis HTML każdego rozmiaru: { "92": "<p>…</p>", "98": "…" }.
alter table produkty add column if not exists opis_rozmiary jsonb;

-- Dominujący kolor zdjęcia (analiza obrazu, bez tła). Klucz = adres zdjęcia,
-- więc wynik przeżywa ponowny import (adresy zdjęć z Allegro się nie zmieniają).
-- Scalanie ustawia jako główne zdjęcie w kolorze wariantu.
create table if not exists zdjecia_kolory (
  url        text primary key,
  rodzina    text not null,          -- np. szary, różowy, niebieski, zielony…
  udzial     real,                   -- udział tej rodziny w pikselach produktu (0–1)
  updated_at timestamptz not null default now()
);

-- Dostęp wyłącznie przez service role (serwer). Bez publicznych polityk.
alter table zdjecia_kolory enable row level security;
