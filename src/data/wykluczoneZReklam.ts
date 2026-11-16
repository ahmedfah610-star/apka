// Produkty wyłączone z reklam Google (Zakupy / Performance Max). Zostają w sklepie i w bezpłatnych
// informacjach o produktach — plik produktowy dostaje dla nich `excluded_destination`.
// Klucz: id produktu (bez rozmiaru) — wyłącza wszystkie jego rozmiary.
export const WYKLUCZONE_Z_REKLAM: Record<string, string> = {
  // Komplet niemowlęcy body + półśpiochy + czapeczka: najwięcej kosztu w kampanii (43 zł / 174 kliknięcia
  // od 25.10), jedyne zamówienie anulowane, na stanie po 1 sztuce na rozmiar (16.11.2026).
  "al-m-1sdb64a": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-4yfrij": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-3sa4h4": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
  "al-m-wmepdp": "komplet body+półśpiochy+czapeczka — 1 szt./rozmiar, koszt bez sprzedaży",
};

/** Miejsca docelowe Merchant Center, z których produkt jest wyłączony (pusta lista = reklamujemy). */
export function wykluczeniaReklam(idProduktu: string): string[] {
  return WYKLUCZONE_Z_REKLAM[idProduktu] ? ["Shopping_ads", "Display_ads"] : [];
}
