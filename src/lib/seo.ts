// Wspólne ustawienia SEO. Bazowy adres bierzemy z env (docelowa domena),
// z bezpiecznym fallbackiem.
export const BAZA_URL = (process.env.NEXT_PUBLIC_BAZOWY_URL || "https://fasolka.pl").replace(/\/$/, "");
export const NAZWA_SKLEPU = "Fasolka";
export const OPIS_SKLEPU =
  "Fasolka — sklep z ubrankami dla dzieci 0–12 lat. Miękkie, bezpieczne i wygodne ubrania dla dziewczynek, chłopców i niemowląt. Wysyłka InPost, 14 dni na zwrot.";

/** Skrypt JSON-LD (dane strukturalne dla Google). */
export function jsonLd(dane: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(dane).replace(/</g, "\\u003c"),
  };
}
