// Bieżąca promocja z kodem rabatowym — jedno źródło dla paska z odliczaniem i walidacji kodu
// (koszyk, zamówienie, serwer). Kod działa tylko w podanym oknie czasowym; po końcu pasek znika sam.
// Minimum liczone z wartości produktów (bez dostawy) — tak jak każdy kod rabatowy w sklepie.

export interface Promocja {
  kod: string;
  procent: number;
  minKoszyk: number; // zł, wartość produktów bez dostawy
  od: string; // ISO z przesunięciem strefy (czas polski)
  do: string;
}

export const PROMOCJA: Promocja | null = {
  kod: "BOCIAN5",
  procent: 5,
  minKoszyk: 80,
  od: "2026-10-31T00:00:00+01:00",
  do: "2026-11-01T23:59:59+01:00",
};

export type StanPromocji = "przed" | "trwa" | "po";

export function stanPromocji(p: Promocja | null, teraz: number = Date.now()): StanPromocji | null {
  if (!p) return null;
  if (teraz < new Date(p.od).getTime()) return "przed";
  if (teraz > new Date(p.do).getTime()) return "po";
  return "trwa";
}

export function promocjaTrwa(teraz: number = Date.now()): Promocja | null {
  return stanPromocji(PROMOCJA, teraz) === "trwa" ? PROMOCJA : null;
}
