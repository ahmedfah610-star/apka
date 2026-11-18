"use client";

import { KOD_AUTOMATYCZNY } from "@/lib/promocja";

// Test: kod dodawany sam po włożeniu czegoś do koszyka (lib/promocja → KOD_AUTOMATYCZNY).
// W zamówieniu nalicza się bez wpisywania; klient może go usunąć — wtedy nie wraca.
// Serwer i tak sprawdza kod jak każdy inny (pula, termin, raz na numer telefonu).
const KLUCZ = "bobas-kod-auto";

type Zapis = { kod: string; usuniety?: boolean; czas: number };

function odczyt(): Zapis | null {
  try {
    const z = JSON.parse(localStorage.getItem(KLUCZ) || "null") as Zapis | null;
    return z && z.kod === KOD_AUTOMATYCZNY ? z : null;
  } catch {
    return null;
  }
}

/** Po dodaniu do koszyka: włącz kod (jeśli test trwa i klient go wcześniej nie usunął). */
export function aktywujKodAutomatyczny(): void {
  if (!KOD_AUTOMATYCZNY || odczyt()) return;
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ kod: KOD_AUTOMATYCZNY, czas: Date.now() }));
  } catch {
    /* ignoruj */
  }
}

/** Kod do automatycznego naliczenia w koszyku i zamówieniu (null = brak / usunięty przez klienta). */
export function kodAutomatyczny(): string | null {
  const z = odczyt();
  return z && !z.usuniety ? z.kod : null;
}

/** Klient usunął kod albo serwer go odrzucił — nie dodajemy go więcej. */
export function odrzucKodAutomatyczny(kod: string): void {
  if (!KOD_AUTOMATYCZNY || kod !== KOD_AUTOMATYCZNY) return;
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ kod, usuniety: true, czas: Date.now() }));
  } catch {
    /* ignoruj */
  }
}
