// Etykiety dostępności produktu — wspólne dla widoku produktu, listingu i koszyka.

export const PROG_MALO = 5; // od ilu sztuk pokazujemy „ostatnie sztuki"

export type TonStanu = "brak" | "malo" | "ok";
export interface EtykietaStanu {
  tekst: string;
  ton: TonStanu;
}

/**
 * Zwraca etykietę stanu dla łącznej liczby sztuk.
 * `null`/`undefined` = bez limitu magazynowego → brak etykiety (null).
 */
export function etykietaStanu(stan?: number | null): EtykietaStanu | null {
  if (stan === null || stan === undefined) return null;
  if (stan <= 0) return { tekst: "Produkt niedostępny", ton: "brak" };
  if (stan <= PROG_MALO) return { tekst: `Ostatnie sztuki — zostało ${stan}`, ton: "malo" };
  return { tekst: "Dostępny — wysyłka od ręki", ton: "ok" };
}

/** Czy dany rozmiar ma niski stan (do etykiety „zostało X" przy rozmiarze). */
export function maloRozmiaru(ile?: number | null): boolean {
  return typeof ile === "number" && ile > 0 && ile <= 3;
}
