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
    cena: 12.99,
    paczkomat: true,
  },
  {
    id: "inpost-kurier",
    nazwa: "InPost Kurier",
    opis: "Dostawa pod wskazany adres",
    cena: 15.99,
  },
  {
    id: "kurier",
    nazwa: "Kurier standardowy",
    opis: "Dostawa w 2–3 dni robocze",
    cena: 16.99,
  },
];

/** Koszt dostawy z uwzględnieniem darmowego progu. */
export function kosztDostawy(metoda: MetodaDostawy, sumaKoszyka: number): number {
  return sumaKoszyka >= DARMOWA_DOSTAWA_OD ? 0 : metoda.cena;
}
