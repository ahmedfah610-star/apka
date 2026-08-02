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

## Baza danych (Supabase) — wspólny stan magazynowy

Sklep działa bez bazy (fallback: katalog z kodu). Gdy podłączysz **Supabase**
(darmowy tier: 500 MB bazy + 1 GB Storage), produkty, **stany magazynowe**,
zamówienia i zdjęcia są wspólne dla wszystkich klientów, a ilość na stanie
zmniejsza się automatycznie po każdym zamówieniu (atomowo, funkcją SQL).

Konfiguracja (jednorazowo):

1. Załóż projekt na [supabase.com](https://supabase.com) (New project).
2. **SQL Editor** → wklej i uruchom `supabase/schema.sql` (tabele + funkcja
   `zloz_zamowienie` + RLS), potem `supabase/seed.sql` (238 produktów).
3. **Storage** → utwórz **publiczny** bucket o nazwie `produkty` (na zdjęcia
   wgrywane z panelu).
4. **Settings → API** → skopiuj: `Project URL`, klucz `anon public` oraz klucz
   `service_role` (sekretny).
5. Ustaw zmienne środowiskowe (lokalnie w `.env.local`, na Vercel w
   **Settings → Environment Variables**) — patrz `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (sekret)
   - `ADMIN_HASLO` — hasło do panelu `/admin`

Bez tych zmiennych sklep dalej działa (dane z kodu), ale panel i wspólny stan
są nieaktywne.

## Panel administracyjny

`/admin` — pulpit ze statystykami (produkty wg kategorii, zamówienia, obrót)
oraz `/admin/produkty` — wystawianie i zarządzanie ofertami jak na Allegro:
wgrywanie zdjęć (do Supabase Storage) lub przez URL, ceny, **ilości na stanie**
(+/−), włączanie/wyłączanie i usuwanie ofert. Logowanie hasłem `ADMIN_HASLO`
sprawdzane po stronie serwera (cookie httpOnly), więc endpointy `/api/admin/*`
są realnie chronione.

## Wdrożenie na Vercel

1. Wypchnij repozytorium na GitHub.
2. W Vercel: **Add New → Project**, wybierz repo.
3. Framework Preset: Next.js (wykryje się automatycznie).
4. (Opcjonalnie) dodaj zmienne środowiskowe z sekcji powyżej, aby włączyć bazę
   i panel. Bez nich deploy też się powiedzie (wersja z danymi z kodu).
5. Deploy. Działa na darmowym tierze Vercel.

## Struktura katalogów

```
src/
  app/            ekrany (Next.js App Router): / , /produkty
  components/     Nawigacja, KartaProduktu, Newsletter, Stopka
  lib/            filtrowanie/sortowanie produktów (+ testy w __tests__)
  data/           produkty.ts — katalog produktów (tu trafiają oferty z Allegro)
```
