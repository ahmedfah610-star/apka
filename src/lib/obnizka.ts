import type { Produkt } from "@/data/produkty";

// Obniżka ustawiona przy produkcie plakietką „-20%" (cena w panelu jest już po obniżce).
// Cena przed obniżką liczona z procentu — pokazujemy ją przekreśloną obok obecnej.
// To nie dotyczy kodów rabatowych (ZIMA5 itp.) — te działają w koszyku.

export function procentObnizki(badge: string | null | undefined): number | null {
  const m = /^\s*[-−–]\s*(\d{1,2})\s*%\s*$/.exec(badge ?? "");
  const n = m ? Number(m[1]) : NaN;
  return n >= 1 && n <= 90 ? n : null;
}

/** Cena przed obniżką albo null, gdy produkt nie ma plakietki z procentem. */
export function cenaPrzedObnizka(p: Pick<Produkt, "badge" | "cena">, cena: number = p.cena): number | null {
  const pr = procentObnizki(p.badge);
  if (!pr || !(cena > 0)) return null;
  return Math.round((cena / (1 - pr / 100)) * 100) / 100;
}
