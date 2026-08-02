import type { Kategoria, Produkt, Wiek } from "@/data/produkty";

export type FiltrKategoria = Kategoria | "wszystkie";
export type FiltrWiek = Wiek | "wszystkie";
export type Sortowanie = "domyslnie" | "cena-rosnaco" | "cena-malejaco";

export interface Filtry {
  kategoria: FiltrKategoria;
  wiek: FiltrWiek;
  sortBy: Sortowanie;
}

/**
 * Filtruje i sortuje listę produktów wg wybranych filtrów.
 * Funkcja czysta (bez efektów ubocznych) — zwraca nową tablicę.
 */
export function filtrujProdukty(produkty: Produkt[], { kategoria, wiek, sortBy }: Filtry): Produkt[] {
  const lista = produkty.filter(
    (p) =>
      (kategoria === "wszystkie" || p.kategoria === kategoria) &&
      (wiek === "wszystkie" || p.wiek === wiek),
  );

  if (sortBy === "cena-rosnaco") return [...lista].sort((a, b) => a.cena - b.cena);
  if (sortBy === "cena-malejaco") return [...lista].sort((a, b) => b.cena - a.cena);
  return lista;
}

/** Formatuje cenę do postaci "89,90". */
export function formatCena(cena: number): string {
  return cena.toFixed(2).replace(".", ",");
}
