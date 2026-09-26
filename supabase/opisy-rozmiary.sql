-- Opis per rozmiar: na Allegro każdy rozmiar to osobna oferta z własnymi
-- wymiarami („WZROST 92 CM, szerokość 24 cm…"). Po połączeniu rozmiarów w jeden
-- produkt trzymamy opis HTML każdego rozmiaru: { "92": "<p>…</p>", "98": "…" }.
alter table produkty add column if not exists opis_rozmiary jsonb;
