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
  const wgKategorii: Record<Kategoria, number> = { dziewczynki: 0, chlopcy: 0, niemowleta: 0, dorosli: 0 };
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
  obrot: number; // razem z dostawą (tyle zapłacili klienci)
  dostawa: number; // łączna kwota za przesyłki w zamówieniach
  produkty: number; // obrót bez dostawy
  darmowych: number; // zamówienia z darmową dostawą (0 zł)
  sredniaWartosc: number;
  sztuk: number;
}

export function statystykiZamowien(zamowienia: Zamowienie[]): StatystykiZamowien {
  let obrot = 0;
  let dostawa = 0;
  let darmowych = 0;
  let sztuk = 0;
  for (const z of zamowienia) {
    obrot += Number(z.razem) || 0;
    const d = Number(z.dostawa) || 0;
    dostawa += d;
    if (d === 0) darmowych++;
    for (const poz of z.pozycje) sztuk += poz.ilosc;
  }
  const liczba = zamowienia.length;
  const zaok = (n: number) => Math.round(n * 100) / 100;
  return {
    liczba,
    obrot: zaok(obrot),
    dostawa: zaok(dostawa),
    produkty: zaok(obrot - dostawa),
    darmowych,
    sredniaWartosc: liczba ? obrot / liczba : 0,
    sztuk,
  };
}
