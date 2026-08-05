export const DARMOWA_DOSTAWA_OD = 150;

export interface MetodaDostawy {
  id: string;
  nazwa: string;
  opis: string;
  cena: number;
  /** Czy wymaga wyboru paczkomatu InPost. */
  paczkomat?: boolean;
  /** Czy wymaga wyboru punktu odbioru na mapie (operator poniżej). */
  punkt?: boolean;
  /** Operator dla mapy punktów (Bliska Paczka): RUCH=ORLEN Paczka, DPD, POCZTA. */
  operator?: string;
  /** Krótka etykieta operatora (np. "ORLEN Paczka") do nagłówka mapy. */
  operatorNazwa?: string;
  /** Dodatkowe wyjaśnienie pokazywane klientowi (np. czym jest opcja ekonomiczna). */
  info?: string;
}

export const METODY_DOSTAWY: MetodaDostawy[] = [
  {
    id: "inpost-paczkomat-eko",
    nazwa: "InPost Paczkomat (ekonomiczny)",
    opis: "Odbiór z paczkomatu — tańsza opcja",
    cena: 10.5,
    paczkomat: true,
    info: "Wysyłka ekonomiczna do paczkomatu: taniej, przeznaczona dla mniejszych paczek (gabaryt A). Dostawa może potrwać nieco dłużej niż standardowa.",
  },
  {
    id: "inpost-paczkomat",
    nazwa: "InPost Paczkomat 24/7",
    opis: "Odbiór z paczkomatu o dowolnej porze — standard",
    cena: 14.6,
    paczkomat: true,
  },
  {
    id: "orlen-paczka",
    nazwa: "ORLEN Paczka",
    opis: "Odbiór w punkcie (Żabka, Orlen, Kolporter i in.)",
    cena: 11.99,
    punkt: true,
    operator: "RUCH",
    operatorNazwa: "ORLEN Paczka",
  },
  {
    id: "dpd-punkt",
    nazwa: "DPD Pickup (punkt)",
    opis: "Odbiór w punkcie DPD Pickup",
    cena: 10.99,
    punkt: true,
    operator: "DPD",
    operatorNazwa: "DPD Pickup",
  },
  {
    id: "pocztex-punkt",
    nazwa: "Pocztex (punkt odbioru)",
    opis: "Odbiór w placówce lub punkcie Pocztex",
    cena: 12.99,
    punkt: true,
    operator: "POCZTA",
    operatorNazwa: "Pocztex",
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
