import { describe, expect, it } from "vitest";
import { liczDzienneKcal, liczKoszt, liczPorcje, liczRER } from "@/lib/calculator";
import type { Karma, Oferta, ProfilPupila } from "@/types/domain";

function profilBazowy(overrides: Partial<ProfilPupila> = {}): ProfilPupila {
  return {
    imie: "Reksio",
    gatunek: "pies",
    wiekLat: 3,
    wagaKg: 20,
    rozmiar: "srednia",
    sterylizowany: true,
    stanCiala: "norma",
    aktywnosc: "umiarkowany",
    rodzajKarmy: "obie",
    alergeny: [],
    cele: [],
    schorzenie: "brak",
    ...overrides,
  };
}

describe("liczRER", () => {
  it("liczy RER dla wagi 20 kg", () => {
    expect(liczRER(20)).toBeCloseTo(70 * Math.pow(20, 0.75), 5);
  });
});

describe("liczDzienneKcal", () => {
  it("dorosły, sterylizowany pies, aktywność umiarkowana", () => {
    const profil = profilBazowy({ wagaKg: 20, sterylizowany: true, aktywnosc: "umiarkowany" });
    const rer = 70 * Math.pow(20, 0.75);
    expect(liczDzienneKcal(profil)).toBe(Math.round(rer * 1.6 * 1.0));
  });

  it("szczenię psa ma czynnik 2.5 niezależnie od sterylizacji", () => {
    const profil = profilBazowy({ wiekLat: 0.5, wagaKg: 5, aktywnosc: "umiarkowany" });
    const rer = 70 * Math.pow(5, 0.75);
    expect(liczDzienneKcal(profil)).toBe(Math.round(rer * 2.5 * 1.0));
  });

  it("nadwaga zmniejsza zapotrzebowanie o czynnik 0.8", () => {
    const profil = profilBazowy({ wagaKg: 20, stanCiala: "nadwaga", aktywnosc: "umiarkowany" });
    const rer = 70 * Math.pow(20, 0.75);
    expect(liczDzienneKcal(profil)).toBe(Math.round(rer * 1.6 * 1.0 * 0.8));
  });

  it("kot dorosły niesterylizowany, aktywność bardzo_aktywny", () => {
    const profil = profilBazowy({
      gatunek: "kot",
      wagaKg: 4,
      sterylizowany: false,
      aktywnosc: "bardzo_aktywny",
    });
    const rer = 70 * Math.pow(4, 0.75);
    expect(liczDzienneKcal(profil)).toBe(Math.round(rer * 1.4 * 1.2));
  });
});

describe("liczPorcje", () => {
  it("liczy porcję dzienną i miesięczne kg", () => {
    const karma: Karma = {
      id: "k1",
      name: "Test",
      brand: "B",
      species: "pies",
      stage: ["adult"],
      grainFree: true,
      goals: [],
      activity: "all",
      contains: [],
      type: "sucha",
      kcalKg: 3500,
      packageKg: 10,
      priceKg: 20,
      vetFor: null,
    };
    const { porcjaGDzien, kgMiesiac } = liczPorcje(1000, karma);
    expect(porcjaGDzien).toBeCloseTo((1000 / 3500) * 1000, 5);
    expect(kgMiesiac).toBeCloseTo(((1000 / 3500) * 1000 * 30) / 1000, 5);
  });
});

describe("liczKoszt", () => {
  const karma: Karma = {
    id: "k1",
    name: "Test",
    brand: "B",
    species: "pies",
    stage: ["adult"],
    grainFree: true,
    goals: [],
    activity: "all",
    contains: [],
    type: "sucha",
    kcalKg: 3500,
    packageKg: 10,
    priceKg: 20,
    vetFor: null,
  };

  it("liczy koszt miesięczny i liczbę dni z najtańszej oferty", () => {
    const oferty: Oferta[] = [
      { foodId: "k1", shop: "A", price: 200, delivery: 0, inStock: true, fast: true, affiliateUrl: "" },
      { foodId: "k1", shop: "B", price: 190, delivery: 20, inStock: true, fast: false, affiliateUrl: "" },
    ];
    const porcjaGDzien = 250;
    const kgMiesiac = (250 * 30) / 1000;
    const wynik = liczKoszt(karma, porcjaGDzien, kgMiesiac, oferty);

    // najtańsza liczona jako cena + dostawa: A=200, B=210 -> wygrywa A
    const cenaZaKg = 200 / 10;
    expect(wynik.kosztMiesiac).toBe(Math.round(kgMiesiac * cenaZaKg));
    expect(wynik.dniStarcza).toBe(Math.round((10 * 1000) / porcjaGDzien));
  });

  it("zwraca null, gdy brak ofert", () => {
    const wynik = liczKoszt(karma, 250, 7.5, []);
    expect(wynik.kosztMiesiac).toBeNull();
    expect(wynik.dniStarcza).toBeNull();
  });
});
