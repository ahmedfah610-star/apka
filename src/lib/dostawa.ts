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
  /** Widoczna w zamówieniu (wyłączona w trybie admina = ukryta dla klientów). */
  aktywna?: boolean;
}

/** Ustawienia dostawy edytowane w trybie admina (domyślne = wartości z kodu poniżej). */
export interface UstawieniaDostawy {
  metody: MetodaDostawy[];
  darmowaOd: number;
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
export function kosztDostawy(metoda: MetodaDostawy, sumaKoszyka: number, darmowaOd: number = DARMOWA_DOSTAWA_OD): number {
  return sumaKoszyka >= darmowaOd ? 0 : metoda.cena;
}

export const DOMYSLNA_DOSTAWA: UstawieniaDostawy = { metody: METODY_DOSTAWY, darmowaOd: DARMOWA_DOSTAWA_OD };

/**
 * Łączy zapisane ustawienia z metodami z kodu. Edytować można tylko nazwę, opisy, cenę
 * i widoczność — techniczne pola (paczkomat, punkt, operator mapy) zawsze z kodu.
 */
export function polaczUstawienia(zapis: unknown): UstawieniaDostawy {
  const z = (zapis && typeof zapis === "object" ? zapis : {}) as { metody?: Partial<MetodaDostawy>[]; darmowaOd?: unknown };
  const poId = new Map((Array.isArray(z.metody) ? z.metody : []).map((m) => [m?.id, m]));
  const tekst = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const cena = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 500 ? Math.round(n * 100) / 100 : undefined;
  };
  const metody = METODY_DOSTAWY.map((m) => {
    const e = poId.get(m.id);
    if (!e) return { ...m, aktywna: true };
    return {
      ...m,
      nazwa: tekst(e.nazwa, 80) ?? m.nazwa,
      opis: tekst(e.opis, 160) ?? m.opis,
      info: e.info === "" ? undefined : tekst(e.info, 600) ?? m.info,
      cena: cena(e.cena) ?? m.cena,
      aktywna: e.aktywna !== false,
    };
  });
  const prog = Number(z.darmowaOd);
  return { metody, darmowaOd: Number.isFinite(prog) && prog >= 0 && prog <= 100000 ? Math.round(prog * 100) / 100 : DARMOWA_DOSTAWA_OD };
}

/** Najtańsza widoczna metoda (np. „dostawa od 10,50 zł"). */
export function najtanszaDostawa(u: UstawieniaDostawy): number {
  const ceny = u.metody.filter((m) => m.aktywna !== false).map((m) => m.cena);
  return ceny.length ? Math.min(...ceny) : 0;
}

/** „10,50 zł" */
export function zl(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} zł`;
}

// Kwota w tekście: pełne złote bez groszy („150 zł”), inaczej z groszami.
export function kwotaTekst(n: number): string {
  return Number.isInteger(n) ? `${n} zł` : zl(n);
}

// Teksty (FAQ itp.) mają w miejscu progu darmowej dostawy znacznik {darmowaOd}.
export function zProgiem(tekst: string, darmowaOd: number): string {
  return tekst.replaceAll("{darmowaOd}", kwotaTekst(darmowaOd));
}
