# Fasolka — sklep z ubraniami dziecięcymi

Sklep internetowy z ubraniami dla dzieci 0-12 lat (marka **Fasolka**). Styl: czysty,
edytorialny, białe tło, terakota jako kolor akcentu. Zbudowany w Next.js 14 (App Router)
+ Tailwind CSS.

## Ekrany

- **`/`** — strona główna: hero, kategorie (dziewczynki / chłopcy / niemowlęta),
  bestsellery, banner wyprzedaży, sekcja o marce, newsletter, stopka.
- **`/produkty`** — listing wszystkich produktów z filtrami (kategoria, wiek, rozmiar),
  sortowaniem (cena rosnąco/malejąco) i obsługą parametru `?kategoria=` z URL.

## Produkty i migracja z Allegro

Wszystkie artykuły siedzą w jednym pliku: **`src/data/produkty.ts`** (tablica `PRODUKTY`).
To tutaj przenosi się oferty z Allegro. Dla każdego produktu:

- `nazwa`, `cena`, `kategoria` (`dziewczynki` | `chlopcy` | `niemowleta`), `wiek`,
- `zdjecie` — adres URL zdjęcia (np. z `allegroimg.com`; `null` = kolorowy placeholder),
- `badge` — opcjonalna plakietka (`NOWOŚĆ`, `BESTSELLER`, `-20%`).

Dane demo (12 przykładowych produktów) podmieniasz na realne oferty. Logika filtrowania i
sortowania jest wydzielona do `src/lib/filtrowanie.ts` i pokryta testami.

> Uwaga: Allegro blokuje automatyczne pobieranie ofert (ochrona przed botami), więc dane
> produktów trzeba dostarczyć z eksportu (np. BaseLinker → CSV) albo ręcznie. Adresy zdjęć
> z `allegroimg.com` można podlinkować bezpośrednio w polu `zdjecie`.

## Wymagania

- Node.js 18+ i npm

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja wystartuje na `http://localhost:3000`.

## Testy jednostkowe

```bash
npm run test
```

Testują filtrowanie i sortowanie produktów (`src/lib/filtrowanie.ts`).

## Wdrożenie na Vercel

1. Wypchnij repozytorium na GitHub.
2. W Vercel: **Add New → Project**, wybierz repo.
3. Framework Preset: Next.js (wykryje się automatycznie).
4. Deploy. Działa na darmowym tierze Vercel — nie wymaga żadnych zmiennych środowiskowych.

## Struktura katalogów

```
src/
  app/            ekrany (Next.js App Router): / , /produkty
  components/     Nawigacja, KartaProduktu, Newsletter, Stopka
  lib/            filtrowanie/sortowanie produktów (+ testy w __tests__)
  data/           produkty.ts — katalog produktów (tu trafiają oferty z Allegro)
```
