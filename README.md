# mojaŁapa

Porównywarka karmy dla psów i kotów — dobiera karmę pod konkretnego pupila (na podstawie
profilu), a potem pokazuje oferty z różnych sklepów. Model hybrydowy: najpierw dopasowanie,
potem cena.

## Stan projektu (etap 1)

Zaimplementowane:

- Kreator profilu pupila (6 kroków, stan lokalny w `localStorage`).
- Logika dopasowania karm (`src/lib/matching.ts`) + kalkulator kcal/porcji/kosztu
  (`src/lib/calculator.ts`), z testami jednostkowymi (`src/lib/__tests__`).
- Statyczny katalog karm (`src/data/foods.ts`) i przykładowe oferty sklepów
  (`src/data/offers.ts`), z fallbackiem linków (`src/lib/links.ts`) gdy nie ma realnego
  linku afiliacyjnego.
- Ekran wyników z filtrami (cena z dostawą, sklep, dostawa 24h, dostępność, sortowanie).
- Ranking weterynarzy i fryzjerów (`/specjalisci`) — wybór miasta i kategorii, sortowanie
  ważone oceną i liczbą opinii (`src/lib/providersService.ts`). Zasilany realnymi danymi
  z **Google Places API** (`src/lib/googlePlaces.ts`, endpoint `src/app/api/specjalisci/route.ts`);
  bez skonfigurowanego klucza automatycznie spada na dane demo (`src/data/uslugodawcy.ts`).

Jeszcze nie podłączone (kolejne etapy z brief'u): Supabase (auth + zapis profili `pets`,
RLS), katalog `foods` i `providers` w bazie, alerty cenowe.

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

Testują logikę dopasowania (`matching.ts`) i kalkulator (`calculator.ts`).

## Zmienne środowiskowe (Supabase — etap 2+)

Skopiuj `.env.example` do `.env.local` i uzupełnij wartościami z Supabase
(Project Settings → API):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Nie commituj `.env.local` — jest w `.gitignore`.

## Google Places API (ranking weterynarzy/fryzjerów)

1. Wejdź na [Google Cloud Console](https://console.cloud.google.com/) → stwórz projekt
   (lub użyj istniejącego).
2. **APIs & Services → Library** → włącz **Places API**.
3. **APIs & Services → Credentials** → **Create Credentials → API key**.
4. (Ważne) Ogranicz klucz: **API restrictions → Restrict key** → wybierz tylko **Places API**.
   Klucz jest używany wyłącznie po stronie serwera, więc nie trzeba ograniczać go do domen.
5. Włącz billing na koncie Google Cloud (Places API wymaga aktywnego billingu, ale
   Google daje miesięczny darmowy limit, który zwykle pokrywa ruch małej aplikacji).
6. Wklej klucz do `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=AIza...
   ```

Bez tego kroku `/specjalisci` działa nadal — pokazuje dane demo.

## Wdrożenie na Vercel

1. Wypchnij repozytorium na GitHub.
2. W Vercel: **Add New → Project**, wybierz repo `mojaLapa`.
3. Framework Preset: Next.js (wykryje się automatycznie).
4. W **Environment Variables** dodaj:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (gdy podłączysz Supabase — etap 2),
   - `GOOGLE_PLACES_API_KEY` (żeby `/specjalisci` pokazywał realne dane, nie demo).
5. Deploy. Działa na darmowym tierze Vercel.

## Struktura katalogów

```
src/
  app/            ekrany (Next.js App Router): / , /kreator , /wyniki , /specjalisci
  components/     komponenty UI i ProfilProvider (stan profilu pupila)
  lib/            logika dopasowania, kalkulator, linki/oferty (serwis do podmiany na feed afiliacyjny)
  data/           statyczny katalog karm i przykładowe oferty (seed)
  types/          typy domenowe (ProfilPupila, Karma, Oferta, DopasowanaKarma)
```

## Kolejne etapy

1. ✅ Scaffolding + kreator + logika dopasowania + ekran wyników (ten etap).
2. Supabase: auth (magic link) + zapis/edycja profili pupili w tabeli `pets` + RLS.
3. Przeniesienie katalogu `foods` do Supabase + moduł ofert gotowy na realny feed
   afiliacyjny (Awin/TradeDoubler) — patrz `src/lib/offersService.ts`.
4. Alerty cenowe i powiadomienia (tabela `price_alerts`).
5. Realne dane weterynarzy/fryzjerów (np. Google Places API) + opinie użytkowników
   mojaŁapy w tabelach `providers` i `reviews` — patrz `src/lib/providersService.ts`.
