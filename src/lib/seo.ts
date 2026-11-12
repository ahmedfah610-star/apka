// Wspólne ustawienia SEO. Bazowy adres bierzemy z env (docelowa domena),
// z bezpiecznym fallbackiem.
export const BAZA_URL = (process.env.NEXT_PUBLIC_BAZOWY_URL || "https://bobas-shopping.pl").replace(/\/$/, "");
export const NAZWA_SKLEPU = "bobas-shopping";
export const OPIS_SKLEPU =
  "Ubranka dla dzieci 0–12 lat i odzież męska w dobrych cenach: ciepłe komplety, dresy, body i swetry. Wymiary w cm, wysyłka w 1–2 dni, 14 dni na zwrot. Zamów dziś!";

/** Skrypt JSON-LD (dane strukturalne dla Google). */
export function jsonLd(dane: Record<string, unknown> | Record<string, unknown>[]) {
  return {
    __html: JSON.stringify(dane).replace(/</g, "\\u003c"),
  };
}

/**
 * Opis produktu do wyników Google (meta description, ~155 znaków): konkret i zachęta zamiast
 * wklejonego opisu z Allegro (emoji, wymiary, ucięty w połowie zdania).
 */
export function opisMetaProduktu(p: { nazwa: string; cena: number; kolor?: string | null }, rozmiary: string[]): string {
  const cena = `${p.cena.toFixed(2).replace(".", ",")} zł`;
  const kolor = p.kolor ? `, ${p.kolor}` : "";
  const rozm = rozmiary.length ? (rozmiary.length <= 4 ? rozmiary.join(", ") : `${rozmiary[0]}–${rozmiary[rozmiary.length - 1]}`) : "";
  const czesci = [
    `${p.nazwa}${kolor} — ${cena}.`,
    rozm ? `Rozmiary: ${rozm}.` : "",
    "Wymiary w cm w opisie, wysyłka w 1–2 dni.",
    "Zamów online!",
  ].filter(Boolean);
  let t = czesci.join(" ");
  if (t.length > 158) t = czesci.filter((c) => !c.startsWith("Wymiary")).join(" ");
  if (t.length > 158) t = `${p.nazwa}${kolor} — ${cena}. Zamów online!`;
  return t.length > 160 ? `${t.slice(0, 157).trimEnd()}…` : t;
}
