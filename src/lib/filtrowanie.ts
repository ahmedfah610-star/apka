import type { Kategoria, Produkt, Wiek } from "@/data/produkty";

export type FiltrKategoria = Kategoria | "wszystkie";
export type FiltrWiek = Wiek | "wszystkie";
export type Sortowanie = "domyslnie" | "cena-rosnaco" | "cena-malejaco";
export type FiltrWyroznienie = "wszystkie" | "NOWOŚĆ" | "BESTSELLER" | "promocja";

export interface ZakresCeny {
  label: string;
  min: number;
  max: number;
}

export const ZAKRESY_CENY: ZakresCeny[] = [
  { label: "do 20 zł", min: 0, max: 20 },
  { label: "20–40 zł", min: 20, max: 40 },
  { label: "40–60 zł", min: 40, max: 60 },
  { label: "powyżej 60 zł", min: 60, max: Infinity },
];

export interface Filtry {
  kategoria: FiltrKategoria;
  wiek: FiltrWiek;
  sortBy: Sortowanie;
  rozmiary?: string[];
  cena?: ZakresCeny | null;
  wyroznienie?: FiltrWyroznienie;
}

/**
 * Filtruje i sortuje listę produktów wg wybranych filtrów.
 * Funkcja czysta (bez efektów ubocznych) — zwraca nową tablicę.
 */
export function filtrujProdukty(
  produkty: Produkt[],
  { kategoria, wiek, sortBy, rozmiary, cena, wyroznienie }: Filtry,
): Produkt[] {
  const lista = produkty.filter((p) => {
    if (kategoria !== "wszystkie" && p.kategoria !== kategoria) return false;
    if (wiek !== "wszystkie" && p.wiek !== wiek) return false;
    if (rozmiary && rozmiary.length > 0 && !p.rozmiary?.some((s) => rozmiary.includes(s))) return false;
    if (cena && !(p.cena >= cena.min && p.cena < cena.max)) return false;
    if (wyroznienie && wyroznienie !== "wszystkie") {
      if (wyroznienie === "promocja") {
        if (!p.badge || !p.badge.includes("%")) return false;
      } else if (p.badge !== wyroznienie) {
        return false;
      }
    }
    return true;
  });

  if (sortBy === "cena-rosnaco") return [...lista].sort((a, b) => a.cena - b.cena);
  if (sortBy === "cena-malejaco") return [...lista].sort((a, b) => b.cena - a.cena);
  return lista;
}

/** Formatuje cenę do postaci "89,90". */
export function formatCena(cena: number): string {
  return cena.toFixed(2).replace(".", ",");
}
