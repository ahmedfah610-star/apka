import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase", () => ({ sbService: () => null }));
import type { Produkt } from "@/data/produkty";
import { rozmiaryNaStanie, rozmiaryTekst, wybierzHit } from "@/lib/hitTygodnia";

const p = (id: string, o: Partial<Produkt> = {}) =>
  ({ id, nazwa: id, cena: 30, kategoria: "niemowleta", zdjecie: `https://a.allegroimg.com/original/${id}`, zdjecia: ["a", "b"], rozmiary: ["56", "62"], stanRozmiary: { "56": 1, "62": 2 }, stan: 3, ...o }) as Produkt;

describe("hit tygodnia", () => {
  const katalog = [p("stary"), p("dorosly", { kategoria: "dorosli" }), p("wyprzedany", { stan: 0, stanRozmiary: { "56": 0 } }), p("nowy")];

  it("najchętniej kupowany dziecięcy na stanie", () => {
    const h = wybierzHit(katalog, new Map([["dorosly", 9], ["wyprzedany", 8], ["stary", 3], ["nowy", 1]]));
    expect(h?.produkt.id).toBe("stary");
    expect(h?.zrodlo).toBe("sprzedaz");
  });

  it("remis — wygrywa nowszy", () => {
    expect(wybierzHit(katalog, new Map([["stary", 2], ["nowy", 2]]))?.produkt.id).toBe("nowy");
  });

  it("bez sprzedaży — wybór zmienia się co tydzień, w tygodniu stały", () => {
    const duzo = Array.from({ length: 8 }, (_, i) => p(`n${i}`));
    const a = wybierzHit(duzo, new Map(), new Date("2026-11-02T10:00:00Z"))!;
    const b = wybierzHit(duzo, new Map(), new Date("2026-11-06T10:00:00Z"))!;
    const c = wybierzHit(duzo, new Map(), new Date("2026-11-10T10:00:00Z"))!;
    expect(a.zrodlo).toBe("wybor");
    expect(a.produkt.id).toBe(b.produkt.id);
    expect(c.produkt.id).not.toBe(a.produkt.id);
  });

  it("nic dostępnego — brak banera", () => {
    expect(wybierzHit([p("x", { stan: 0, stanRozmiary: { "56": 0, "62": 0 } })], new Map())).toBeUndefined();
  });

  it("rozmiary na stanie i krótki zapis", () => {
    expect(rozmiaryNaStanie(p("r", { rozmiary: ["74", "56", "62"], stanRozmiary: { "56": 1, "62": 0, "74": 2 } }))).toEqual(["56", "74"]);
    expect(rozmiaryTekst(["56", "62", "68", "74"])).toBe("56–74");
    expect(rozmiaryTekst(["56", "62"])).toBe("56, 62");
    expect(rozmiaryTekst(["30-34 cm", "35-38 cm", "39-42 cm", "43-46 cm"])).toBe("30-34 cm, 35-38 cm, 39-42 cm i więcej");
  });

  it("ręczny wybór wygrywa ze sprzedażą; wyprzedany → następny z listy, potem automat", () => {
    const k = [p("a"), p("b"), p("sprzedawany"), p("wyprzedany", { stan: 0, stanRozmiary: { "56": 0, "62": 0 } })];
    const sprzedaz = new Map([["sprzedawany", 5]]);
    expect(wybierzHit(k, sprzedaz, new Date(), undefined, ["b", "a"])).toMatchObject({ produkt: { id: "b" }, zrodlo: "polecany" });
    expect(wybierzHit(k, sprzedaz, new Date(), undefined, ["wyprzedany", "a"])?.produkt.id).toBe("a");
    expect(wybierzHit(k, sprzedaz, new Date(), undefined, ["nie-ma"])).toMatchObject({ produkt: { id: "sprzedawany" }, zrodlo: "sprzedaz" });
  });
});
