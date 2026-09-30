import { describe, expect, it } from "vitest";
import { kluczWariantu, przypiszRodziny, zwinWarianty } from "@/lib/warianty";
import type { Produkt } from "@/data/produkty";

const OPIS = "Legginsy prążkowane z wysokim stanem, miękka bawełna z elastanem, wygodne na co dzień i do przedszkola.";
const p = (over: Partial<Produkt>): Produkt => ({
  id: "x", nazwa: "Legginsy prążkowane", cena: 25, kategoria: "dziewczynki", wiek: "2-6", wiekLabel: "2-6 lat",
  badge: null, zdjecie: null, hue: 100, opis: OPIS, ...over,
});

describe("przypiszRodziny — ścisłe łączenie kolorów", () => {
  it("łączy ten sam model w różnych kolorach (nazwa różni się tylko kolorem)", () => {
    const k = przypiszRodziny([
      p({ id: "a", nazwa: "Legginsy prążkowane czarne", kolor: "czarny" }),
      p({ id: "b", nazwa: "Legginsy prążkowane zielone", kolor: "zielony" }),
    ]);
    expect(kluczWariantu(k[0])).toBe(kluczWariantu(k[1]));
    expect(zwinWarianty(k)).toHaveLength(1);
  });

  it("różne nadruki z tym samym opisem są osobno", () => {
    const k = przypiszRodziny([
      p({ id: "a", nazwa: "Body babcia tu była", kolor: "czerwony" }),
      p({ id: "b", nazwa: "Body tata wie dużo", kolor: "niebieski" }),
    ]);
    expect(zwinWarianty(k)).toHaveLength(2);
  });

  it("powtórzony kolor rozbija grupę (to nie są warianty koloru)", () => {
    const k = przypiszRodziny([
      p({ id: "a", kolor: "czarny" }),
      p({ id: "b", kolor: "czarny" }),
      p({ id: "c", kolor: "zielony" }),
    ]);
    expect(zwinWarianty(k)).toHaveLength(3);
  });

  it("różna cena albo brak koloru — osobno", () => {
    expect(zwinWarianty(przypiszRodziny([p({ id: "a", kolor: "czarny" }), p({ id: "b", kolor: "zielony", cena: 30 })]))).toHaveLength(2);
    expect(zwinWarianty(przypiszRodziny([p({ id: "a", kolor: "czarny" }), p({ id: "b", kolor: null })]))).toHaveLength(2);
  });
});
