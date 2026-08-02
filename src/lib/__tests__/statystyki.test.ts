import { describe, expect, it } from "vitest";
import { statystykiKatalogu, statystykiZamowien } from "@/lib/statystyki";
import type { Produkt } from "@/data/produkty";
import type { Zamowienie } from "@/lib/sklepStore";

const p = (over: Partial<Produkt>): Produkt => ({
  id: "x",
  nazwa: "Test",
  cena: 50,
  kategoria: "chlopcy",
  wiek: "2-6",
  wiekLabel: "2-6 lat",
  badge: null,
  zdjecie: null,
  hue: 100,
  ...over,
});

describe("statystykiKatalogu", () => {
  it("liczy sumy, kategorie i ceny", () => {
    const s = statystykiKatalogu([
      p({ cena: 20, kategoria: "dziewczynki" }),
      p({ cena: 40, kategoria: "dziewczynki" }),
      p({ cena: 60, kategoria: "chlopcy", badge: "-20%" }),
    ]);
    expect(s.liczba).toBe(3);
    expect(s.wgKategorii.dziewczynki).toBe(2);
    expect(s.wgKategorii.chlopcy).toBe(1);
    expect(s.minCena).toBe(20);
    expect(s.maxCena).toBe(60);
    expect(s.sredniaCena).toBe(40);
    expect(s.zPromocja).toBe(1);
  });

  it("radzi sobie z pustą listą", () => {
    const s = statystykiKatalogu([]);
    expect(s.liczba).toBe(0);
    expect(s.sredniaCena).toBe(0);
    expect(s.minCena).toBe(0);
  });
});

describe("statystykiZamowien", () => {
  it("sumuje obrót i sztuki", () => {
    const z: Zamowienie[] = [
      { id: "1", data: "", metoda: "kurier", suma: 100, dostawa: 0, razem: 100, pozycje: [{ id: "a", nazwa: "A", cena: 50, ilosc: 2 }] },
      { id: "2", data: "", metoda: "kurier", suma: 30, dostawa: 15, razem: 45, pozycje: [{ id: "b", nazwa: "B", cena: 30, ilosc: 1 }] },
    ];
    const s = statystykiZamowien(z);
    expect(s.liczba).toBe(2);
    expect(s.obrot).toBe(145);
    expect(s.sztuk).toBe(3);
    expect(s.sredniaWartosc).toBe(72.5);
  });
});
