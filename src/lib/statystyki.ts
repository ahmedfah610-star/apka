import type { Kategoria, Produkt } from "@/data/produkty";
import type { Zamowienie } from "@/lib/sklepStore";

export interface StatystykiKatalogu {
  liczba: number;
  wgKategorii: Record<Kategoria, number>;
  sredniaCena: number;
  minCena: number;
  maxCena: number;
  zPromocja: number;
}

export function statystykiKatalogu(produkty: Produkt[]): StatystykiKatalogu {
  const wgKategorii: Record<Kategoria, number> = { dziewczynki: 0, chlopcy: 0, niemowleta: 0 };
  let suma = 0;
  let min = Infinity;
  let max = 0;
  let promo = 0;
  for (const p of produkty) {
    wgKategorii[p.kategoria]++;
    suma += p.cena;
    if (p.cena < min) min = p.cena;
    if (p.cena > max) max = p.cena;
    if (p.badge && p.badge.includes("%")) promo++;
  }
  const liczba = produkty.length;
  return {
    liczba,
    wgKategorii,
    sredniaCena: liczba ? suma / liczba : 0,
    minCena: liczba ? min : 0,
    maxCena: max,
    zPromocja: promo,
  };
}

export interface StatystykiZamowien {
  liczba: number;
  obrot: number;
  sredniaWartosc: number;
  sztuk: number;
}

export function statystykiZamowien(zamowienia: Zamowienie[]): StatystykiZamowien {
  let obrot = 0;
  let sztuk = 0;
  for (const z of zamowienia) {
    obrot += z.razem;
    for (const poz of z.pozycje) sztuk += poz.ilosc;
  }
  const liczba = zamowienia.length;
  return { liczba, obrot, sredniaWartosc: liczba ? obrot / liczba : 0, sztuk };
}
