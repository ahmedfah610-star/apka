export const DARMOWA_DOSTAWA_OD = 150;

export interface MetodaDostawy {
  id: string;
  nazwa: string;
  opis: string;
  cena: number;
  /** Czy wymaga wyboru paczkomatu InPost. */
  paczkomat?: boolean;
}

export const METODY_DOSTAWY: MetodaDostawy[] = [
  {
    id: "inpost-paczkomat",
    nazwa: "InPost Paczkomat 24/7",
    opis: "Odbiór z paczkomatu o dowolnej porze",
    cena: 11.99,
    paczkomat: true,
  },
  {
    id: "inpost-kurier",
    nazwa: "Kurier InPost",
    opis: "Dostawa pod wskazany adres",
    cena: 14.99,
  },
  {
    id: "kurier-dhl",
    nazwa: "Kurier DHL",
    opis: "Dostawa pod adres w 1–2 dni robocze",
    cena: 19.99,
  },
];

/** Koszt dostawy z uwzględnieniem darmowego progu. */
export function kosztDostawy(metoda: MetodaDostawy, sumaKoszyka: number): number {
  return sumaKoszyka >= DARMOWA_DOSTAWA_OD ? 0 : metoda.cena;
}
