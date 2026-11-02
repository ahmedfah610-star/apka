import { describe, expect, it } from "vitest";
import type { Produkt } from "@/data/produkty";
import { cieplePierwsze, czyCieply, sezonZimowy } from "@/lib/sezon";
import { filtrujProdukty } from "@/lib/filtrowanie";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";

const p = (id: string, nazwa: string, kategoria = "niemowleta") => ({ id, nazwa, kategoria, cena: 20, wiek: "0-2", rozmiary: [] }) as unknown as Produkt;

describe("sezon zimowy", () => {
  it("rozpoznaje ciepłe rzeczy po nazwie (także bez ogonków)", () => {
    expect(czyCieply({ nazwa: "Sweterek dla dziewczynki ciepły miś" })).toBe(true);
    expect(czyCieply({ nazwa: "Spodnie dresowe OCIEPLANE polarem" })).toBe(true);
    expect(czyCieply({ nazwa: "Legginsy welurowe wysoki stan" })).toBe(true);
    expect(czyCieply({ nazwa: "Kamizelka bezrękawnik sweterkowa" })).toBe(true);
    expect(czyCieply({ nazwa: "Body niemowlęce długi rękaw" })).toBe(false);
    expect(czyCieply({ nazwa: "T shirt dzianinowy krótki rękaw" })).toBe(false);
  });

  it("trwa od października do lutego (czas polski)", () => {
    expect(sezonZimowy(new Date("2026-11-02T12:00:00Z"))).toBe(true);
    expect(sezonZimowy(new Date("2027-02-28T22:30:00Z"))).toBe(true); // 23:30 w Polsce
    expect(sezonZimowy(new Date("2027-02-28T23:30:00Z"))).toBe(false); // już 1 marca w Polsce
    expect(sezonZimowy(new Date("2026-07-15T12:00:00Z"))).toBe(false);
    expect(sezonZimowy(new Date("2026-09-30T21:59:00Z"))).toBe(false);
    expect(sezonZimowy(new Date("2026-09-30T22:01:00Z"))).toBe(true); // 1 października 00:01
  });

  const lista = [p("a", "Body krótki rękaw"), p("b", "Sweterek ciepły"), p("c", "Legginsy bawełniane"), p("d", "Czapka zimowa")];

  it("ciepłe na początek, reszta w tej samej kolejności", () => {
    expect(cieplePierwsze(lista).map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("lista „polecane” zimą zaczyna się od ciepłych, poza sezonem bez zmian", () => {
    const f = { kategoria: "wszystkie" as const, wiek: "wszystkie" as const, sortBy: "domyslnie" as const };
    expect(filtrujProdukty(lista, { ...f, sezonZimowy: true }).map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
    expect(filtrujProdukty(lista, f).map((x) => x.id)).toEqual(["a", "b", "c", "d"]);
    expect(filtrujProdukty(lista, { ...f, sortBy: "nowosci", sezonZimowy: true }).map((x) => x.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("kolekcja „Ubranka na zimę”: tylko ciepłe dziecięce", () => {
    const kol = KOLEKCJE.find((k) => k.slug === "ubranka-na-zime")!;
    const wynik = produktyKolekcji([...lista, p("m", "Sweter męski ciepły", "dorosli")], kol);
    expect(wynik.map((x) => x.id)).toEqual(["b", "d"]);
  });
});
