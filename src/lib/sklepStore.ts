import { PRODUKTY, type Kategoria, type Produkt, type Wiek } from "@/data/produkty";

// ---------------------------------------------------------------------------
// Lekki magazyn danych panelu admina — trzymany w localStorage przeglądarki.
// To rozwiązanie DEMO: dane są lokalne dla danej przeglądarki. Do trwałego,
// współdzielonego katalogu użyj eksportu (do repo) lub bazy danych (patrz README).
// ---------------------------------------------------------------------------

const KLUCZ_PRODUKTY = "fasolka-admin-produkty";
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
  data: string; // ISO
  pozycje: PozycjaZamowienia[];
  suma: number;
  dostawa: number;
  razem: number;
  metoda: string;
}

function czytaj<T>(klucz: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const s = localStorage.getItem(klucz);
    return s ? (JSON.parse(s) as T[]) : [];
  } catch {
    return [];
  }
}
function zapisz<T>(klucz: string, dane: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(klucz, JSON.stringify(dane));
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/ł/g, "l")
      .normalize("NFKD")
      // usuń znaki diakrytyczne (zakres łączących U+0300–U+036F)
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
  zdjecie?: string | null;
  badge?: string | null;
  opis?: string;
}

/** Buduje pełny obiekt Produkt z danych z formularza. */
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
    zdjecie: d.zdjecie || null,
    opis: d.opis || undefined,
    hue: HUE[d.kategoria],
  };
}

// --- Produkty dodane w panelu ---
export function pobierzDodatkowe(): Produkt[] {
  return czytaj<Produkt>(KLUCZ_PRODUKTY);
}
export function dodajProdukt(p: Produkt) {
  zapisz(KLUCZ_PRODUKTY, [...pobierzDodatkowe(), p]);
}
export function usunProdukt(id: string) {
  zapisz(
    KLUCZ_PRODUKTY,
    pobierzDodatkowe().filter((p) => p.id !== id),
  );
}
export function aktualizujProdukt(id: string, zmiany: Partial<Produkt>) {
  zapisz(
    KLUCZ_PRODUKTY,
    pobierzDodatkowe().map((p) => (p.id === id ? { ...p, ...zmiany } : p)),
  );
}

/** Pełny katalog = produkty z kodu + dodane w panelu. */
export function katalog(): Produkt[] {
  return [...PRODUKTY, ...pobierzDodatkowe()];
}

// --- Zamówienia (demo) ---
export function pobierzZamowienia(): Zamowienie[] {
  return czytaj<Zamowienie>(KLUCZ_ZAMOWIENIA);
}
export function dodajZamowienie(z: Zamowienie) {
  zapisz(KLUCZ_ZAMOWIENIA, [z, ...pobierzZamowienia()]);
}
