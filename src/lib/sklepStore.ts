import { type Kategoria, type Produkt, type Wiek } from "@/data/produkty";

// Czyste helpery używane przez panel. Dane (produkty, stany, zamówienia)
// trzyma teraz baza (Supabase) — patrz src/lib/produktyDb.ts i endpointy /api.

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
  /** Status: nowe | oczekuje_na_platnosc | oplacone | wyslane | anulowane. */
  status?: string;
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
