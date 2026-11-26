import { describe, expect, it } from "vitest";
import { KOLEKCJE, produktyKolekcji, znajdzKolekcje } from "@/data/kolekcje";
import { sezonPrezentowy, SLUG_PREZENTY } from "@/lib/sezon";
import type { Produkt } from "@/data/produkty";

// Strony prezentowe: właściwe produkty, bez wyprzedanych i męskich, różnorodna góra strony,
// zakładka w menu tylko w sezonie (15.11–24.12).
const P = (id: string, nazwa: string, cena: number, o: Partial<Produkt> = {}): Produkt =>
  ({ id, nazwa, cena, kategoria: "niemowleta", wiek: "0-2", wiekLabel: "0-2 lata", hue: 0, stan: 3, ...o }) as Produkt;

const KATALOG: Produkt[] = [
  P("a1", "Pajacyk czapka babcia tu była", 29.99, { kolor: "różowy" }),
  P("a2", "Pajacyk dla chłopca czapka babcia tu była", 29.99, { kolor: "biały" }),
  P("a3", "Pajacyk czapka babcia tu była róż", 29.99, { kolor: "brzoskwiniowy" }),
  P("b1", "Body długi rękaw z napisami mój dziadek jest najlepszy", 22.5),
  P("c1", "Czapka dzianiny pomponem", 9.99),
  P("d1", "Wyprawka komplet niemowlęcy 5 części", 35.99),
  P("e1", "Ubranko do chrztu wizytowe dla chłopca", 49.99),
  P("e2", "Ubranko do chrztu wizytowe dla dziewczynki", 53.99, { stan: 0 }),
  P("x1", "Body babcia tu była", 22.5, { stan: 0 }), // wyprzedane
  P("x2", "Sweter męski babcia", 25, { kategoria: "dorosli" }), // męskie
  P("x3", "Komplet dresowy dla niemowlaka", 39.99), // > 30 zł
];

const ids = (slug: string) => produktyKolekcji(KATALOG, znajdzKolekcje(slug)!).map((p) => p.id);

describe("strony prezentowe", () => {
  it("są w kolekcjach (adresy, mapa strony) i linkują się nawzajem jako grupa", () => {
    const slugi = KOLEKCJE.filter((k) => k.grupa === "prezenty").map((k) => k.slug);
    expect(slugi).toEqual([SLUG_PREZENTY, "ubranka-z-napisem-dla-wnuka", "prezent-dla-niemowlaka", "ubranka-do-chrztu"]);
  });

  it("Mikołajki i Święta: droższe zestawy na górze, bez drobiazgów, męskich i wyprzedanych — i nie 3× ten sam pajacyk", () => {
    const l = ids(SLUG_PREZENTY);
    expect(l).not.toContain("x1"); // wyprzedane
    expect(l).not.toContain("x2"); // męskie
    expect(l).not.toContain("c1"); // czapka za 9,99 zł — drobiazg
    expect(l).toContain("x3"); // komplet za 39,99 zł — na prezent ludzie wydają więcej
    expect(l.slice(0, 3)).toEqual(["e1", "d1", "a1"]); // chrzest 49,99, wyprawka 35,99, pajacyk z napisem
    expect(l.indexOf("a2")).toBeGreaterThan(l.indexOf("b1")); // drugi kolor pajacyka niżej niż inne body z napisem
  });

  it("ubranka z napisem: tylko napisy dla babci/dziadka/taty, bez wyprzedanych i męskich", () => {
    expect(ids("ubranka-z-napisem-dla-wnuka").sort()).toEqual(["a1", "a2", "a3", "b1"]);
  });

  it("prezent dla niemowlaka: zestawy i chrzest na górze", () => {
    expect(ids("prezent-dla-niemowlaka").slice(0, 2).sort()).toEqual(["d1", "e1"]);
  });

  it("ubranka do chrztu: wyprzedane nie znikają (mała kolekcja), ale są na końcu", () => {
    expect(ids("ubranka-do-chrztu")).toEqual(["e1", "e2"]);
  });

  it("zakładka „Prezenty” w menu: od 15 listopada do Wigilii (czas polski)", () => {
    expect(sezonPrezentowy(new Date("2026-11-14T22:59:00Z"))).toBe(false); // 14.11, 23:59 w Polsce
    expect(sezonPrezentowy(new Date("2026-11-14T23:00:00Z"))).toBe(true); // 15.11, 0:00 w Polsce
    expect(sezonPrezentowy(new Date("2026-12-24T22:59:00Z"))).toBe(true);
    expect(sezonPrezentowy(new Date("2026-12-24T23:00:00Z"))).toBe(false); // 25.12
    expect(sezonPrezentowy(new Date("2027-03-01T12:00:00Z"))).toBe(false);
  });
});
