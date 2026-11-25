// Dane klienta zapamiętane w TEJ przeglądarce po złożonym zamówieniu (jak „ostatni adres” na Allegro):
// przy następnym zakupie — w koszyku i w „Kup teraz” — pola są już wypełnione, a wybrany punkt odbioru
// zaznaczony. Nic nie trafia do bazy; klient może to wyłączyć odznaczając „Zapamiętaj dane”
// (wtedy zapis jest usuwany). Odczyt wypełnia tylko puste pola.

import type { DaneKontaktowe, Punkt } from "@/lib/zamowienieWspolne";
import type { StanFaktury } from "@/components/FormularzFaktury";

const KLUCZ = "bobas-dane-klienta";
const MAX_WIEK_MS = 365 * 86400000; // po roku zapominamy

export interface ZapamietaneDane {
  dane: DaneKontaktowe;
  metodaId?: string;
  paczkomat?: Punkt | null;
  punkty?: Record<string, Punkt>; // punkt odbioru osobno dla każdej metody (ORLEN ≠ DPD)
  faktura?: Omit<StanFaktury, "chce" | "uwagi">; // dane do faktury — gotowe po zaznaczeniu „Chcę fakturę”
  czas: number;
}

const tekst = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const punktOk = (p: unknown): Punkt | null => {
  const x = p as Punkt | null;
  return x && typeof x.kod === "string" && x.kod && typeof x.opis === "string"
    ? { kod: x.kod.slice(0, 60), opis: x.opis.slice(0, 240), ...(typeof x.miasto === "string" ? { miasto: x.miasto.slice(0, 80) } : {}) }
    : null;
};

export function wczytajDane(): ZapamietaneDane | null {
  try {
    const z = JSON.parse(localStorage.getItem(KLUCZ) || "null") as Partial<ZapamietaneDane> | null;
    if (!z || typeof z !== "object" || !z.dane || typeof z.czas !== "number" || Date.now() - z.czas > MAX_WIEK_MS) return null;
    const d = z.dane as Partial<DaneKontaktowe>;
    const punkty: Record<string, Punkt> = {};
    for (const [id, p] of Object.entries(z.punkty ?? {})) {
      const ok = punktOk(p);
      if (ok) punkty[id.slice(0, 40)] = ok;
    }
    return {
      dane: {
        imie: tekst(d.imie, 120),
        email: tekst(d.email, 160),
        telefon: tekst(d.telefon, 30),
        adres: tekst(d.adres, 200),
        miasto: tekst(d.miasto, 80),
        kod: tekst(d.kod, 12),
      },
      metodaId: typeof z.metodaId === "string" ? z.metodaId.slice(0, 40) : undefined,
      paczkomat: punktOk(z.paczkomat),
      punkty,
      faktura: z.faktura && typeof z.faktura === "object" ? z.faktura : undefined,
      czas: z.czas,
    };
  } catch {
    return null;
  }
}

export function zapiszDane(z: Omit<ZapamietaneDane, "czas">): void {
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ ...z, czas: Date.now() }));
  } catch {
    /* pełna pamięć / tryb prywatny — trudno */
  }
}

export function zapomnijDane(): void {
  try {
    localStorage.removeItem(KLUCZ);
  } catch {
    /* ignoruj */
  }
}

/** Uzupełnia tylko puste pola (to, co klient już wpisał lub co przyszło z konta, ma pierwszeństwo). */
export function uzupelnijPuste(d: DaneKontaktowe, z: DaneKontaktowe): DaneKontaktowe {
  return {
    imie: d.imie || z.imie,
    email: d.email || z.email,
    telefon: d.telefon || z.telefon,
    adres: d.adres || z.adres,
    miasto: d.miasto || z.miasto,
    kod: d.kod || z.kod,
  };
}

/** Faktura z zapisu: dane gotowe, ale „Chcę fakturę” zostaje odznaczone (klient decyduje za każdym razem). */
export function fakturaZZapisu(f: StanFaktury, z: ZapamietaneDane["faktura"]): StanFaktury {
  if (!z || f.nazwa || f.nip || typeof z.nazwa !== "string" || !z.nazwa) return f;
  return {
    ...f,
    typ: z.typ === "osoba" ? "osoba" : "firma",
    nip: tekst(z.nip, 16),
    nazwa: tekst(z.nazwa, 200),
    adres: tekst(z.adres, 200),
    kod: tekst(z.kod, 12),
    miasto: tekst(z.miasto, 80),
    email: tekst(z.email, 160),
  };
}

/** Zapis po złożeniu zamówienia (wywołać tuż przed przejściem do płatności). */
export function zapamietajPoZamowieniu(
  zapamietaj: boolean,
  d: { dane: DaneKontaktowe; metodaId: string; paczkomat: Punkt | null; punkt: Punkt | null; faktura: StanFaktury },
): void {
  if (!zapamietaj) return zapomnijDane();
  const poprzednie = wczytajDane();
  const { chce: _c, uwagi: _u, ...faktura } = d.faktura;
  zapiszDane({
    dane: d.dane,
    metodaId: d.metodaId,
    paczkomat: d.paczkomat ?? poprzednie?.paczkomat ?? null,
    punkty: { ...(poprzednie?.punkty ?? {}), ...(d.punkt ? { [d.metodaId]: d.punkt } : {}) },
    faktura: d.faktura.chce && faktura.nazwa ? faktura : poprzednie?.faktura,
  });
}
