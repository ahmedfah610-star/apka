import type { Produkt } from "@/data/produkty";
import { sztukNaStanie } from "@/lib/feedEtykiety";

// Produkty wyłączone z płatnych reklam Google (Zakupy / Performance Max). Zostają w sklepie i w bezpłatnych
// informacjach o produktach — plik produktowy dostaje dla nich `excluded_destination`.

/** Ręczna lista — klucz: id produktu (bez rozmiaru), wyłącza wszystkie jego rozmiary. */
export const WYKLUCZONE_Z_REKLAM: Record<string, string> = {
  // Komplet niemowlęcy body + półśpiochy + czapeczka: najwięcej kosztu w kampanii (43 zł / 174 kliknięcia
  // od 25.10), jedyne zamówienie anulowane, na stanie po 1 sztuce na rozmiar (16.11.2026).
  "al-m-1sdb64a": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-4yfrij": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-3sa4h4": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-wmepdp": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
};

/** Ubranka z napisami dla rodziny (babcia, dziadek, „Mały Prezes”…) — najlepiej sprzedający się temat; reklamujemy zawsze. */
export const NAPISY_DLA_RODZINY = /babci|babcia|dziad|prezes|kocham|\btat[aąy]\b|\bmam[aąy]\b|cioci|ciocia|wujek|wujka|chrzestn|wnucz/i;

/** Dlaczego produkt nie idzie do płatnych reklam (null = reklamujemy). */
export function powodWykluczenia(p: Pick<Produkt, "id" | "nazwa" | "kategoria" | "stan" | "stanRozmiary">): string | null {
  if (WYKLUCZONE_Z_REKLAM[p.id]) return WYKLUCZONE_Z_REKLAM[p.id];
  // Męskie spodnie dresowe: ~22 zł w reklamach od 25.10, w GA4 ani jednego dodania do koszyka.
  if (p.kategoria === "dorosli" && /spodnie/i.test(p.nazwa)) return "męskie spodnie — kliknięcia bez sprzedaży";
  // Dziecięce z 1 sztuką na stanie: jedna sprzedaż i produktu nie ma, a reklama płaci za kliknięcia.
  // Wyjątek: ubranka z napisami dla rodziny — sprzedają się nawet przy małym stanie.
  if (p.kategoria !== "dorosli" && sztukNaStanie(p) <= 1 && !NAPISY_DLA_RODZINY.test(p.nazwa)) return "dziecięce — ostatnia sztuka";
  return null;
}

/** Miejsca docelowe Merchant Center, z których produkt jest wyłączony (pusta lista = reklamujemy). */
export function wykluczeniaReklam(p: Pick<Produkt, "id" | "nazwa" | "kategoria" | "stan" | "stanRozmiary">): string[] {
  return powodWykluczenia(p) ? ["Shopping_ads", "Display_ads"] : [];
}

/** Rozmiary męskie od 3XL wzwyż — „duże rozmiary” w tytule reklamy. */
export function duzyRozmiar(rozmiar?: string): boolean {
  if (!rozmiar) return false;
  const m = rozmiar.trim().toUpperCase().match(/^([3-9])XL$/);
  return !!m;
}
