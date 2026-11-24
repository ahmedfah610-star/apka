// Brak towaru po opłaceniu: ile zwrócić klientowi za brakujące pozycje.
// Cały koszyk brakuje → cała zapłacona kwota (z dostawą). Część → wartość brakujących pozycji
// pomniejszona proporcjonalnie o rabat z kodu (klient zapłacił za nie mniej), dostawa zostaje.

export interface PozycjaZamowienia {
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string | null;
  kolor?: string | null;
  zdjecie?: string | null;
}

export interface WpisBraku {
  czas: string;
  pozycje: string[]; // nazwy brakujących pozycji (z rozmiarem)
  kwota: number;
  zwrot: "zwrocone" | "konto";
  potwierdzenie?: string; // nazwa pliku z potwierdzeniem zwrotu (wysłany w załączniku)
}

const grosze = (n: number) => Math.round(n * 100) / 100;

export function opisPozycji(p: PozycjaZamowienia): string {
  return [p.nazwa, p.rozmiar ? `rozm. ${p.rozmiar}` : "", p.kolor ?? ""].filter(Boolean).join(", ");
}

/** Poprawne, unikalne indeksy brakujących pozycji (puste = błąd). */
export function indeksyBraku(pozycje: PozycjaZamowienia[], we: unknown): number[] {
  if (!Array.isArray(we)) return [];
  return [...new Set(we.map(Number))].filter((i) => Number.isInteger(i) && i >= 0 && i < pozycje.length).sort((a, b) => a - b);
}

export function kwotaZwrotu(z: { pozycje: PozycjaZamowienia[]; suma: number; rabat?: number; razem: number }, indeksy: number[]): { kwota: number; calosc: boolean } {
  const calosc = indeksy.length > 0 && indeksy.length === z.pozycje.length;
  if (calosc) return { kwota: grosze(z.razem), calosc };
  const wartosc = indeksy.reduce((s, i) => s + Number(z.pozycje[i].cena) * Number(z.pozycje[i].ilosc), 0);
  const rabat = Number(z.rabat ?? 0);
  const czescRabatu = z.suma > 0 && rabat > 0 ? (rabat * wartosc) / z.suma : 0;
  return { kwota: grosze(Math.max(0, wartosc - czescRabatu)), calosc };
}
