import type { Produkt } from "@/data/produkty";

// Dobór treści cotygodniowego newslettera: prawdziwe nowości zamiast w kółko tych samych produktów.

export const DNI_NOWOSCI = 7;
export const MAX_PRODUKTOW = 6;

const dostepny = (p: Produkt) => (p.stan ?? 1) > 0 && !p.ukryty;

/**
 * Najnowsze produkty dziecięce na stanie, dodane w ostatnim tygodniu (od najnowszego).
 * `dodane` — id → data dodania (z bazy). Odzież dla dorosłych pomijamy: zapisują się rodzice.
 */
export function wybierzNowosci(katalog: Produkt[], dodane: Map<string, string>, limit = MAX_PRODUKTOW): Produkt[] {
  return katalog
    .filter((p) => dodane.has(p.id) && p.kategoria !== "dorosli" && dostepny(p))
    .sort((a, b) => +new Date(dodane.get(b.id)!) - +new Date(dodane.get(a.id)!))
    .slice(0, limit);
}

/** Numer tygodnia roku (ISO 8601) — do rotacji poradników z bloga. */
export function tydzienRoku(d: Date): number {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dzienTyg = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dzienTyg);
  const poczatek = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((+t - +poczatek) / 86400000 + 1) / 7);
}

/** Co tydzień inny poradnik (po kolei przez całą listę). */
export function artykulTygodnia<T>(artykuly: T[], d: Date): T | undefined {
  if (!artykuly.length) return undefined;
  return artykuly[(d.getUTCFullYear() * 53 + tydzienRoku(d)) % artykuly.length];
}

// Skrót na granicy słowa (temat maila nie może urywać się w pół wyrazu).
function skroc(s: string, max: number): string {
  if (s.length <= max) return s;
  const ciecie = s.slice(0, max);
  const spacja = ciecie.lastIndexOf(" ");
  return (spacja > max / 2 ? ciecie.slice(0, spacja) : ciecie).trimEnd() + "…";
}

/** Temat z nazwą nowości — inny co tydzień. */
export function tematNewslettera(produkty: Pick<Produkt, "nazwa">[]): string {
  if (!produkty.length) return "Nowości tygodnia w bobas-shopping";
  const pierwszy = skroc(produkty[0].nazwa, 48);
  return produkty.length > 1 ? `Nowości tygodnia: ${pierwszy} i więcej` : `Nowość tygodnia: ${pierwszy}`;
}

/** Wynik ostatniego uruchomienia (tabela `ustawienia`) — widoczny w panelu. */
export const KLUCZ_OSTATNIEJ = "newsletter:ostatnia";
export interface OstatniaWysylka {
  czas: string;
  wyslano: number;
  subskrybenci: number;
  produkty: string[]; // nazwy
  temat?: string;
  powod?: "brak_nowosci" | "brak_subskrybentow" | "blad";
}
