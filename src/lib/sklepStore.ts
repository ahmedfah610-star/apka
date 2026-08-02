import { PRODUKTY, type Kategoria, type Produkt, type Wiek } from "@/data/produkty";

// ---------------------------------------------------------------------------
// Lekki magazyn danych panelu admina — trzymany w localStorage przeglądarki.
// DEMO: dane są lokalne dla danej przeglądarki. Do trwałego, współdzielonego
// katalogu użyj eksportu (do repo) albo bazy danych (patrz README).
// ---------------------------------------------------------------------------

const KLUCZ_PRODUKTY = "fasolka-admin-produkty";
const KLUCZ_OVERRIDES = "fasolka-admin-overrides";
const KLUCZ_ZAMOWIENIA = "fasolka-zamowienia";

export interface PozycjaZamowienia {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
}

export interface Zamowienie {
  id: string;
  data: string;
  pozycje: PozycjaZamowienia[];
  suma: number;
  dostawa: number;
  razem: number;
  metoda: string;
}

function czytaj<T>(klucz: string, domyslne: T): T {
  if (typeof window === "undefined") return domyslne;
  try {
    const s = localStorage.getItem(klucz);
    return s ? (JSON.parse(s) as T) : domyslne;
  } catch {
    return domyslne;
  }
}
function zapisz<T>(klucz: string, dane: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(klucz, JSON.stringify(dane));
    return true;
  } catch {
    return false; // np. przekroczony limit localStorage (za duże zdjęcia)
  }
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 44) || "produkt"
  );
}

const HUE: Record<Kategoria, number> = { dziewczynki: 340, chlopcy: 230, niemowleta: 160 };
const WIEK_LABEL: Record<Wiek, string> = { "0-2": "0-2 lata", "2-6": "2-6 lat", "6-12": "6-12 lat" };

export interface DaneProduktu {
  nazwa: string;
  cena: number;
  kategoria: Kategoria;
  wiek: Wiek;
  rozmiary: string[];
  zdjecia: string[];
  stan?: number | null;
  badge?: string | null;
  opis?: string;
}

export function zbudujProdukt(d: DaneProduktu): Produkt {
  return {
    id: `${slugify(d.nazwa)}-${Date.now().toString(36)}`,
    nazwa: d.nazwa.trim(),
    cena: d.cena,
    kategoria: d.kategoria,
    wiek: d.wiek,
    wiekLabel: WIEK_LABEL[d.wiek],
    badge: d.badge || null,
    rozmiary: d.rozmiary,
    zdjecia: d.zdjecia,
    zdjecie: d.zdjecia[0] ?? null,
    opis: d.opis || undefined,
    stan: d.stan ?? undefined,
    hue: HUE[d.kategoria],
  };
}

/** Główne zdjęcie produktu (z galerii lub pola zdjecie). */
export function glowneZdjecie(p: Produkt): string | null {
  return p.zdjecia?.[0] ?? p.zdjecie ?? null;
}

// --- Produkty dodane w panelu ---
export function pobierzDodatkowe(): Produkt[] {
  return czytaj<Produkt[]>(KLUCZ_PRODUKTY, []);
}
export function dodajProdukt(p: Produkt): boolean {
  return zapisz(KLUCZ_PRODUKTY, [...pobierzDodatkowe(), p]);
}
export function usunProdukt(id: string) {
  zapisz(
    KLUCZ_PRODUKTY,
    pobierzDodatkowe().filter((p) => p.id !== id),
  );
  usunOverride(id);
}

// --- Nakładki (edycja ceny/stanu/statusu dowolnego produktu) ---
type Override = Partial<Pick<Produkt, "cena" | "stan" | "badge" | "ukryty">>;
export function pobierzOverrides(): Record<string, Override> {
  return czytaj<Record<string, Override>>(KLUCZ_OVERRIDES, {});
}
export function ustawOverride(id: string, zmiany: Override) {
  const all = pobierzOverrides();
  all[id] = { ...all[id], ...zmiany };
  zapisz(KLUCZ_OVERRIDES, all);
}
export function usunOverride(id: string) {
  const all = pobierzOverrides();
  delete all[id];
  zapisz(KLUCZ_OVERRIDES, all);
}

/** Pełny katalog (z kodu + dodane), z nałożonymi zmianami z panelu. */
export function katalog(): Produkt[] {
  const dodane = pobierzDodatkowe();
  const over = pobierzOverrides();
  return [...PRODUKTY, ...dodane].map((p) => (over[p.id] ? { ...p, ...over[p.id] } : p));
}

/** Katalog widoczny w sklepie (bez wyłączonych ofert). */
export function katalogSklep(): Produkt[] {
  return katalog().filter((p) => !p.ukryty);
}

// --- Zamówienia (demo) ---
export function pobierzZamowienia(): Zamowienie[] {
  return czytaj<Zamowienie[]>(KLUCZ_ZAMOWIENIA, []);
}
export function dodajZamowienie(z: Zamowienie) {
  zapisz(KLUCZ_ZAMOWIENIA, [z, ...pobierzZamowienia()]);
}
