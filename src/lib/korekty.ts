// Korekty zamówienia: brak produktu (nie wyślemy) i zwrot (klient odesłał towar).
// Zapisywane w zamówieniu (klient.korekty — dane zamówienia obok uwag i znacznika TEST),
// kwoty liczone wyłącznie po stronie serwera z cen zapisanych w zamówieniu.

export type TypKorekty = "brak" | "zwrot";

export interface PozycjaKorekty {
  indeks: number; // pozycja w zamówieniu
  ilosc: number;
  nazwa: string;
  rozmiar?: string | null;
  kolor?: string | null;
  kwota: number; // z uwzględnieniem proporcjonalnej części rabatu
}

export interface Korekta {
  id: string;
  typ: TypKorekty;
  pozycje: PozycjaKorekty[];
  dostawa: number; // zwrócony koszt dostawy (0 lub koszt z zamówienia)
  kwota: number; // razem do zwrotu
  data: string;
  notatka?: string;
  mail?: boolean;
}

export interface ZamowienieDoKorekty {
  pozycje: { nazwa: string; cena: number; ilosc: number; rozmiar?: string | null; kolor?: string | null }[];
  suma: number;
  rabat?: number | null;
  dostawa: number;
  razem: number;
  korekty?: Korekta[];
}

export interface WejscieKorekty {
  typ: string;
  pozycje: { indeks: number; ilosc: number }[];
  zwrotDostawy?: boolean;
  notatka?: string;
}

const gr = (n: number) => Math.round(n * 100) / 100;

export const zwroconoLacznie = (korekty?: Korekta[]) => gr((korekty ?? []).reduce((s, k) => s + (Number(k.kwota) || 0), 0));

/** Ile sztuk danej pozycji zostało już objętych korektami (brak + zwrot). */
export function skorygowano(korekty: Korekta[] | undefined, indeks: number, typ?: TypKorekty): number {
  let n = 0;
  for (const k of korekty ?? []) {
    if (typ && k.typ !== typ) continue;
    for (const p of k.pozycje) if (p.indeks === indeks) n += p.ilosc;
  }
  return n;
}

export function obliczKorekte(
  z: ZamowienieDoKorekty,
  we: WejscieKorekty,
  teraz: Date = new Date(),
): { korekta: Korekta } | { blad: string } {
  if (we.typ !== "brak" && we.typ !== "zwrot") return { blad: "Nieznany typ korekty." };
  const typ = we.typ as TypKorekty;
  const wybrane = (Array.isArray(we.pozycje) ? we.pozycje : []).filter((p) => Number(p?.ilosc) > 0);
  if (wybrane.length === 0 && !we.zwrotDostawy) return { blad: "Zaznacz produkty (i ilość)." };

  // Udział rabatu: zwracamy to, co klient faktycznie zapłacił za produkt.
  const czescPoRabacie = z.suma > 0 ? Math.max(0, 1 - (Number(z.rabat) || 0) / z.suma) : 1;
  const pozycje: PozycjaKorekty[] = [];
  const uzyte = new Set<number>();
  for (const w of wybrane) {
    const indeks = Math.floor(Number(w.indeks));
    const ilosc = Math.floor(Number(w.ilosc));
    const poz = z.pozycje[indeks];
    if (!poz || uzyte.has(indeks)) return { blad: "Nieprawidłowa pozycja zamówienia." };
    uzyte.add(indeks);
    const zostalo = poz.ilosc - skorygowano(z.korekty, indeks);
    if (ilosc < 1 || ilosc > zostalo) {
      return { blad: zostalo <= 0 ? `„${poz.nazwa}” jest już w całości rozliczony.` : `„${poz.nazwa}”: można rozliczyć najwyżej ${zostalo} szt.` };
    }
    pozycje.push({ indeks, ilosc, nazwa: poz.nazwa, rozmiar: poz.rozmiar ?? null, kolor: poz.kolor ?? null, kwota: gr(poz.cena * ilosc * czescPoRabacie) });
  }

  const dostawaJuz = (z.korekty ?? []).some((k) => k.dostawa > 0);
  const dostawa = we.zwrotDostawy && !dostawaJuz ? gr(z.dostawa) : 0;
  if (we.zwrotDostawy && dostawaJuz && pozycje.length === 0) return { blad: "Koszt dostawy został już zwrócony." };

  const kwota = gr(pozycje.reduce((s, p) => s + p.kwota, 0) + dostawa);
  // Suma zwrotów nie może przekroczyć tego, co klient zapłacił.
  const limit = gr(z.razem - zwroconoLacznie(z.korekty));
  const kwotaOst = Math.min(kwota, Math.max(0, limit));

  return {
    korekta: {
      id: `${teraz.getTime().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
      typ,
      pozycje,
      dostawa,
      kwota: gr(kwotaOst),
      data: teraz.toISOString(),
      notatka: typeof we.notatka === "string" && we.notatka.trim() ? we.notatka.replace(/[<>]/g, "").trim().slice(0, 300) : undefined,
    },
  };
}
