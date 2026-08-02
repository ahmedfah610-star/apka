import { describe, expect, it } from "vitest";
import { filtrujProdukty, formatCena, pasujeFraza } from "@/lib/filtrowanie";
import type { Produkt } from "@/data/produkty";

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

const dane: Produkt[] = [
  p({ id: "a", cena: 30, kategoria: "dziewczynki", wiek: "0-2" }),
  p({ id: "b", cena: 90, kategoria: "chlopcy", wiek: "2-6" }),
  p({ id: "c", cena: 60, kategoria: "dziewczynki", wiek: "6-12" }),
];

describe("filtrujProdukty", () => {
  it("bez filtrów zwraca wszystkie produkty", () => {
    const r = filtrujProdukty(dane, { kategoria: "wszystkie", wiek: "wszystkie", sortBy: "domyslnie" });
    expect(r).toHaveLength(3);
  });

  it("filtruje po kategorii", () => {
    const r = filtrujProdukty(dane, { kategoria: "dziewczynki", wiek: "wszystkie", sortBy: "domyslnie" });
    expect(r.map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("filtruje po kategorii i wieku łącznie", () => {
    const r = filtrujProdukty(dane, { kategoria: "dziewczynki", wiek: "0-2", sortBy: "domyslnie" });
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });

  it("sortuje rosnąco i malejąco po cenie", () => {
    const ros = filtrujProdukty(dane, { kategoria: "wszystkie", wiek: "wszystkie", sortBy: "cena-rosnaco" });
    expect(ros.map((x) => x.cena)).toEqual([30, 60, 90]);
    const mal = filtrujProdukty(dane, { kategoria: "wszystkie", wiek: "wszystkie", sortBy: "cena-malejaco" });
    expect(mal.map((x) => x.cena)).toEqual([90, 60, 30]);
  });

  it("nie mutuje wejściowej tablicy przy sortowaniu", () => {
    const kopia = [...dane];
    filtrujProdukty(dane, { kategoria: "wszystkie", wiek: "wszystkie", sortBy: "cena-malejaco" });
    expect(dane.map((x) => x.id)).toEqual(kopia.map((x) => x.id));
  });
});

describe("pasujeFraza (wyszukiwarka)", () => {
  const bluzaNiem = p({ nazwa: "Bluza z misiem", kategoria: "niemowleta" });
  const spodnieChl = p({ nazwa: "Spodnie dresowe sportowe", kategoria: "chlopcy" });
  const sukienkaDz = p({ nazwa: "Sukienka w kwiatki", kategoria: "dziewczynki" });

  it("łączy słowa: kategoria + typ produktu (AND)", () => {
    expect(pasujeFraza(bluzaNiem, "niemowlęca bluza")).toBe(true);
    expect(pasujeFraza(spodnieChl, "chłopcy spodnie")).toBe(true);
    expect(pasujeFraza(spodnieChl, "dziewczynka spodnie")).toBe(false);
    expect(pasujeFraza(bluzaNiem, "niemowlę spodnie")).toBe(false);
  });

  it("ignoruje spójniki i wielkość liter/odmianę", () => {
    expect(pasujeFraza(sukienkaDz, "dla dziewczynki sukienki")).toBe(true);
    expect(pasujeFraza(bluzaNiem, "BLUZA")).toBe(true);
  });

  it("pusta fraza pasuje do wszystkiego", () => {
    expect(pasujeFraza(spodnieChl, "   ")).toBe(true);
  });
});

describe("formatCena", () => {
  it("formatuje z przecinkiem i dwoma miejscami", () => {
    expect(formatCena(89.9)).toBe("89,90");
    expect(formatCena(49)).toBe("49,00");
  });
});
