// Wspólne ustawienia SEO. Bazowy adres bierzemy z env (docelowa domena),
// z bezpiecznym fallbackiem.
export const BAZA_URL = (process.env.NEXT_PUBLIC_BAZOWY_URL || "https://bobas-shopping.pl").replace(/\/$/, "");
export const NAZWA_SKLEPU = "bobas-shopping";
export const OPIS_SKLEPU =
  "bobas-shopping — sklep internetowy AMIN.KIDS Sp. z o.o. z Lublina: ubranka dla niemowląt, dziewczynek i chłopców (0–12 lat) oraz odzież męska. Wysyłka InPost, ORLEN Paczka, DPD, Pocztex i DHL, 14 dni na zwrot.";

/** Skrypt JSON-LD (dane strukturalne dla Google). */
export function jsonLd(dane: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(dane).replace(/</g, "\\u003c"),
  };
}
