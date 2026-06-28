import { describe, expect, it } from "vitest";
import { ocenKarme, ustalEtapZycia } from "@/lib/matching";
import type { Karma, ProfilPupila } from "@/types/domain";

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

function karmaBazowa(overrides: Partial<Karma> = {}): Karma {
  return {
    id: "k1",
    name: "Testowa",
    brand: "TestBrand",
    species: "pies",
    stage: ["adult"],
    grainFree: true,
    goals: [],
    activity: "all",
    contains: ["kurczak"],
    type: "sucha",
    kcalKg: 3500,
    packageKg: 10,
    priceKg: 20,
    vetFor: null,
    ...overrides,
  };
}

describe("ustalEtapZycia", () => {
  it("pies poniżej 1 roku to puppy", () => {
    expect(ustalEtapZycia("pies", 0.5)).toBe("puppy");
  });
  it("pies w wieku 8+ to senior", () => {
    expect(ustalEtapZycia("pies", 8)).toBe("senior");
  });
  it("pies w wieku 3 lata to adult", () => {
    expect(ustalEtapZycia("pies", 3)).toBe("adult");
  });
  it("kot w wieku 11+ to senior", () => {
    expect(ustalEtapZycia("kot", 11)).toBe("senior");
  });
  it("kot poniżej 1 roku to puppy", () => {
    expect(ustalEtapZycia("kot", 0.8)).toBe("puppy");
  });
});

describe("ocenKarme", () => {
  it("odrzuca karmę innego gatunku", () => {
    const wynik = ocenKarme(karmaBazowa({ species: "kot" }), profilBazowy());
    expect(wynik).toBeNull();
  });

  it("odrzuca karmę zawierającą alergen pupila", () => {
    const wynik = ocenKarme(
      karmaBazowa({ contains: ["kurczak"] }),
      profilBazowy({ alergeny: ["kurczak"] })
    );
    expect(wynik).toBeNull();
  });

  it("odrzuca karmę niezgodnego rodzaju, gdy profil nie wybrał 'obie'", () => {
    const wynik = ocenKarme(
      karmaBazowa({ type: "mokra" }),
      profilBazowy({ rodzajKarmy: "sucha" })
    );
    expect(wynik).toBeNull();
  });

  it("dolicza punkty za zgodny etap życia", () => {
    const wynik = ocenKarme(karmaBazowa({ stage: ["adult"] }), profilBazowy({ wiekLat: 3 }));
    expect(wynik).not.toBeNull();
    expect(wynik!.score).toBe(40 + 22 + 6); // baza + etap + aktywność 'all'
    expect(wynik!.powody).toContain("dla dorosłego");
  });

  it("odejmuje punkty, gdy etap się nie zgadza", () => {
    const wynik = ocenKarme(karmaBazowa({ stage: ["senior"] }), profilBazowy({ wiekLat: 3 }));
    expect(wynik!.score).toBe(40 - 15 + 6);
  });

  it("dolicza punkty za wspólny cel i dietę weterynaryjną", () => {
    const wynik = ocenKarme(
      karmaBazowa({ stage: ["adult"], goals: ["joints"], vetFor: "stawy" }),
      profilBazowy({ schorzenie: "stawy" })
    );
    // baza 40 + etap 22 + cel 11 + aktywność 6 + dieta wet 18 = 97
    expect(wynik!.score).toBe(97);
    expect(wynik!.powody).toContain("dieta: stawy");
  });

  it("wynik jest ograniczony do zakresu 35-99", () => {
    const wynik = ocenKarme(
      karmaBazowa({
        stage: ["adult"],
        goals: ["coat", "sensitive", "weight", "joints"],
        vetFor: "stawy",
      }),
      profilBazowy({
        schorzenie: "stawy",
        stanCiala: "nadwaga",
        rozmiar: "duza",
        cele: ["coat", "sensitive", "weight", "joints"],
      })
    );
    expect(wynik!.score).toBeLessThanOrEqual(99);
  });
});
