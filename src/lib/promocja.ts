// Bieżąca promocja z kodem rabatowym — jedno źródło dla paska z odliczaniem i walidacji kodu
// (koszyk, zamówienie, serwer). Kod działa tylko w podanym oknie czasowym; po końcu pasek znika sam.
// do = null → promocja bez daty końca: bez licznika i bez „do kiedy” (wyłącza się ręcznie, ustawiając datę albo PROMOCJA = null).
// Minimum liczone z wartości produktów (bez dostawy) — tak jak każdy kod rabatowy w sklepie.

export interface Promocja {
  kod: string;
  procent: number;
  minKoszyk: number; // zł, wartość produktów bez dostawy
  od: string; // ISO z przesunięciem strefy (czas polski)
  do: string | null;
  // false = kod działa po wpisaniu, ale sklep go nigdzie nie pokazuje (pasek, baner, karty, koszyk, menu)
  widoczna: boolean;
  // ile opłaconych zamówień może użyć kodu (null = bez limitu)
  limitUzyc: number | null;
  // true = jeden numer telefonu może użyć kodu tylko raz (liczą się opłacone zamówienia)
  razNaTelefon: boolean;
}

// Kody działające bez wpisu w panelu. Ukryte (widoczna: false) działają tylko po wpisaniu przy zamówieniu.
// Każdy kod: osobna pula 100 osób, raz na numer telefonu, do 20.02.2027 włącznie.
const WSPOLNE = {
  procent: 5,
  minKoszyk: 0, // bez minimum — rabat od wartości produktów, dostawa bez rabatu
  od: "2026-11-12T00:00:00+01:00",
  do: "2027-02-20T23:59:59+01:00",
  widoczna: false,
  limitUzyc: 100,
  razNaTelefon: true,
};
export const PROMOCJE: Promocja[] = [
  { kod: "ZIMA5", ...WSPOLNE },
  { kod: "BOBAS5", ...WSPOLNE },
];

/** Promocja reklamowana w sklepie (pasek, baner, karty) — pierwsza widoczna; null = żadnej nie pokazujemy. */
export const PROMOCJA: Promocja | null = PROMOCJE.find((p) => p.widoczna) ?? null;

/** Ostatnie 9 cyfr numeru (bez +48, spacji, myślników) — do porównania „ten sam telefon”. */
export function numerTelefonu(t: unknown): string {
  const cyfry = String(t ?? "").replace(/\D/g, "");
  return cyfry.length >= 9 ? cyfry.slice(-9) : "";
}

export type StanPromocji = "przed" | "trwa" | "po";

export function stanPromocji(p: Promocja | null, teraz: number = Date.now()): StanPromocji | null {
  if (!p) return null;
  if (teraz < new Date(p.od).getTime()) return "przed";
  if (p.do && teraz > new Date(p.do).getTime()) return "po";
  return "trwa";
}

export function promocjaTrwa(teraz: number = Date.now()): Promocja | null {
  return stanPromocji(PROMOCJA, teraz) === "trwa" ? PROMOCJA : null;
}

/** Promocja do pokazania w sklepie (pasek, baner, karty, koszyk) — trwa i nie jest ukryta. */
export function promocjaWidoczna(teraz: number = Date.now()): Promocja | null {
  const p = promocjaTrwa(teraz);
  return p && p.widoczna ? p : null;
}

/** Warunki kodu w jednym zdaniu (pasek, karta produktu, koszyk). */
export function warunkiPromocji(p: Promocja): string {
  return p.minKoszyk > 0
    ? `−${p.procent}% przy zakupie produktów za min. ${p.minKoszyk} zł (bez kosztu dostawy)`
    : `−${p.procent}% na wszystkie produkty, bez minimalnej kwoty (rabat nie obejmuje dostawy)`;
}

/** „na zakupy od 50 zł" / „na wszystko" — krótko, do paska i kart. */
export const zakresPromocji = (p: Promocja) => (p.minKoszyk > 0 ? `od ${p.minKoszyk} zł` : "na wszystko");
