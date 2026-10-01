-- bobas-shopping — poprawki produktów nakładane przy odczycie (zastosowane 2026-10-01).
-- {nazwa, kolor, kategoria, model} — codzienne scalanie ofert z Allegro ich nie nadpisuje.
-- `model`: zweryfikowany model (ten sam model = jedna rodzina kolorów, różne modele osobno).
-- Wypełnione z audytu AI (zdjęcia + opisy, 532 produkty); panel zapisuje tu edycje nazwy/koloru/kategorii.
alter table public.produkty add column if not exists poprawki jsonb;
