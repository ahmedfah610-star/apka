// Wspólne zasady składania zamówienia — strona /zamowienie (koszyk) i okno „Kup teraz” przy produkcie.
// Jedno miejsce na walidację po stronie przeglądarki i treść zapytania do /api/platnosc/checkout,
// żeby oba sposoby zamawiania nie rozjechały się (serwer i tak sprawdza wszystko jeszcze raz).

import type { MetodaDostawy } from "@/lib/dostawa";
import { sprawdzFakture } from "@/lib/faktura";
import { PROMOCJE, numerTelefonu } from "@/lib/promocja";
import { fakturaDoWyslania, type StanFaktury } from "@/components/FormularzFaktury";

export interface DaneKontaktowe {
  imie: string;
  email: string;
  telefon: string;
  adres: string;
  miasto: string;
  kod: string; // kod pocztowy
}

export const PUSTE_DANE: DaneKontaktowe = { imie: "", email: "", telefon: "", adres: "", miasto: "", kod: "" };

export interface Punkt {
  kod: string;
  opis: string;
  miasto?: string;
}

export interface PozycjaZamowienia {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
  kolor: string | null;
}

export interface Zamowienie {
  pozycje: PozycjaZamowienia[];
  dostawa: number;
  metoda: MetodaDostawy;
  dane: DaneKontaktowe;
  paczkomat: Punkt | null;
  punkt: Punkt | null;
  faktura: StanFaktury;
  akceptacja: boolean;
  kod: string | null; // przyjęty kod rabatowy
  uwagi?: string;
  zrodlo?: string; // np. „kup-teraz” — do panelu i statystyk
}

const czyKurier = (m: MetodaDostawy) => !m.paczkomat && !m.punkt;

/** Pierwszy błąd do pokazania klientowi albo null, gdy zamówienie można wysłać. */
export function bladZamowienia(z: Zamowienie): string | null {
  const { dane, metoda } = z;
  if (!dane.imie.trim() || !dane.email.trim()) return "Uzupełnij imię i e-mail.";
  if (metoda.paczkomat && !z.paczkomat) return "Wybierz paczkomat InPost.";
  if (metoda.punkt && !z.punkt) return `Wybierz punkt ${metoda.operatorNazwa ?? metoda.nazwa} na mapie.`;
  if (czyKurier(metoda) && (!dane.adres.trim() || !dane.miasto.trim() || !dane.kod.trim())) return "Uzupełnij adres dostawy.";
  if (z.faktura.chce) {
    const fv = sprawdzFakture(fakturaDoWyslania(z.faktura));
    if (!fv.ok) return fv.blad;
  }
  if (!z.akceptacja) return "Zaakceptuj Regulamin i Politykę prywatności.";
  // Kody „raz na numer” (ZIMA5, BOBAS5) wymagają telefonu — prosimy o numer bez tłumaczenia, że chodzi o rabat
  // (klient nie musi znać zasad puli; przewoźnik i tak go potrzebuje).
  if (z.kod && PROMOCJE.some((p) => p.razNaTelefon && p.kod === z.kod) && !numerTelefonu(dane.telefon))
    return "Podaj numer telefonu (9 cyfr) — przewoźnik wyśle Ci SMS o paczce.";
  return null;
}

/** Treść zapytania do /api/platnosc/checkout. */
export function trescZamowienia(z: Zamowienie, nazwaPlatnosci = "Przelewy24") {
  const { dane, metoda } = z;
  return {
    pozycje: z.pozycje,
    dostawa: z.dostawa,
    metodaId: metoda.id,
    metoda: `${metoda.nazwa} · ${nazwaPlatnosci}`,
    kod: z.kod ?? undefined,
    faktura: fakturaDoWyslania(z.faktura),
    ...(z.zrodlo ? { zrodlo: z.zrodlo } : {}),
    klient: {
      imie: dane.imie.trim(),
      email: dane.email.trim(),
      telefon: dane.telefon.trim(),
      uwagi: z.uwagi?.trim() || undefined,
      ...(metoda.paczkomat
        ? { paczkomat: z.paczkomat?.kod, paczkomatOpis: z.paczkomat?.opis }
        : metoda.punkt
          ? { punkt: z.punkt?.kod, punktOpis: z.punkt?.opis, miasto: z.punkt?.miasto }
          : { adres: dane.adres.trim(), miasto: dane.miasto.trim(), kod: dane.kod.trim() }),
    },
  };
}

/** Rabat procentowy liczony tak jak na serwerze (lib/kodyDb): zaokrąglony do grosza, nie więcej niż kwota. */
export function rabatProcentowy(suma: number, procent: number): number {
  return Math.min(Math.round(((suma * procent) / 100) * 100) / 100, suma);
}

/** Cena po rabacie procentowym (np. cena produktu z kodem ZIMA5). */
export function cenaPoRabacie(cena: number, procent: number): number {
  return Math.round((cena - rabatProcentowy(cena, procent)) * 100) / 100;
}
