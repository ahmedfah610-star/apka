import type { Produkt } from "@/data/produkty";

// Etykiety do kampanii Google Ads (custom_label_1..3 w pliku produktowym). Dzięki nim kampanię
// ustawia się RAZ i steruje nią wyłączaniem grup produktów, bez tworzenia nowych kampanii:
//  - cena:  kliknięcie kosztuje tyle samo przy body za 10 zł i komplecie za 55 zł — reklamujemy droższe,
//  - stan:  pojedyncza sztuka wyprzedaje się po jednej sprzedaży — reklama dalej płaci za kliknięcia,
//  - dział: dziecięce i męskie to inni kupujący i inne stawki.
export const PROG_CENY_REKLAMY = 40;
export const PROG_STANU_REKLAMY = 3;

/** Sztuki na stanie łącznie (wszystkie rozmiary). */
export function sztukNaStanie(p: Pick<Produkt, "stan" | "stanRozmiary">): number {
  if (p.stanRozmiary) return Object.values(p.stanRozmiary).reduce((s, n) => s + (Number(n) || 0), 0);
  return Number(p.stan ?? 0) || 0;
}

export function etykietyReklamowe(p: Pick<Produkt, "cena" | "kategoria" | "stan" | "stanRozmiary">): { cena: string; stan: string; dzial: string } {
  return {
    cena: p.cena >= PROG_CENY_REKLAMY ? "cena-40plus" : "cena-ponizej-40",
    stan: sztukNaStanie(p) >= PROG_STANU_REKLAMY ? "stan-3plus" : "stan-1-2",
    dzial: p.kategoria === "dorosli" ? "meskie" : "dzieciece",
  };
}
