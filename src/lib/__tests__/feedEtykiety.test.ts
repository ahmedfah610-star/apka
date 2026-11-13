import { describe, expect, it } from "vitest";
import { etykietyReklamowe, sztukNaStanie, zdjeciaDoReklamy } from "@/lib/feedEtykiety";
import { ZDJECIA_REKLAMOWE } from "@/data/zdjeciaReklamowe";

// Etykiety do kampanii Google Ads: reklamujemy droższe produkty z zapasem, osobno dziecięce i męskie.
describe("etykiety reklamowe w pliku produktowym", () => {
  it("cena: od 40 zł wzwyż", () => {
    expect(etykietyReklamowe({ cena: 39.99, kategoria: "niemowleta", stan: 5 } as never).cena).toBe("cena-20-40");
    expect(etykietyReklamowe({ cena: 20, kategoria: "niemowleta", stan: 5 } as never).cena).toBe("cena-20-40");
    expect(etykietyReklamowe({ cena: 19.99, kategoria: "niemowleta", stan: 5 } as never).cena).toBe("cena-ponizej-20");
    expect(etykietyReklamowe({ cena: 40, kategoria: "niemowleta", stan: 5 } as never).cena).toBe("cena-40plus");
  });

  it("stan: suma sztuk ze wszystkich rozmiarów, próg 3", () => {
    expect(sztukNaStanie({ stanRozmiary: { "62": 1, "68": 2, "74": 0 }, stan: 99 })).toBe(3);
    expect(etykietyReklamowe({ cena: 50, kategoria: "chlopcy", stanRozmiary: { "62": 1, "68": 2 } } as never).stan).toBe("stan-3plus");
    expect(etykietyReklamowe({ cena: 50, kategoria: "chlopcy", stanRozmiary: { "62": 1, "68": 1 } } as never).stan).toBe("stan-1-2");
    expect(etykietyReklamowe({ cena: 50, kategoria: "chlopcy", stan: undefined } as never).stan).toBe("stan-1-2");
  });

  it("dział: męskie osobno od dziecięcych", () => {
    expect(etykietyReklamowe({ cena: 50, kategoria: "dorosli", stan: 4 } as never).dzial).toBe("meskie");
    expect(etykietyReklamowe({ cena: 50, kategoria: "dziewczynki", stan: 4 } as never).dzial).toBe("dzieciece");
  });

  it("wybrane ujęcie reklamowe idzie jako pierwsze, reszta galerii zostaje", () => {
    const p = { id: "x1", zdjecie: "a", zdjecia: ["a", "b", "c"] };
    expect(zdjeciaDoReklamy(p, { x1: "c" })).toEqual({ zdjecia: ["c", "a", "b"], top: true });
    expect(zdjeciaDoReklamy(p, {})).toEqual({ zdjecia: ["a", "b", "c"], top: false });
  });

  it("gdy wybranego zdjęcia nie ma już w galerii — zostaje główne, bez etykiety top", () => {
    expect(zdjeciaDoReklamy({ id: "x1", zdjecie: "a", zdjecia: ["a", "b"] }, { x1: "stare" })).toEqual({ zdjecia: ["a", "b"], top: false });
    expect(zdjeciaDoReklamy({ id: "x2", zdjecie: "a", zdjecia: [] }, {})).toEqual({ zdjecia: ["a"], top: false });
  });

  it("lista wybranych: poprawne adresy zdjęć i id produktów", () => {
    const wpisy = Object.entries(ZDJECIA_REKLAMOWE);
    expect(wpisy.length).toBeGreaterThan(20);
    for (const [id, url] of wpisy) {
      expect(id).toMatch(/^(al-m|reczny)-[a-z0-9]+$/);
      expect(url).toMatch(/^https:\/\/[a-z0-9.-]+\//); // Allegro albo własne zdjęcie wgrane w panelu
    }
  });
});

describe("tytuł do pliku Google", () => {
  it("cienki sweter męski (cienki tylko w opisie) dostaje „cienki” w tytule", async () => {
    const { tytulDoFeedu } = await import("@/lib/feedEtykiety");
    const opis = "CIENKI SWETER MĘSKI SZARY PÓŁGOLF Z ZAMKIEM Lekki, cienki sweter";
    expect(tytulDoFeedu({ nazwa: "Sweter męski rozpinany półgolf klasyczny fason", opis, kategoria: "dorosli" })).toBe(
      "Sweter męski cienki rozpinany półgolf klasyczny fason",
    );
    // już ma „cienki”, ciepły model albo inny dział — bez zmian
    expect(tytulDoFeedu({ nazwa: "Sweter męski cienki półgolf z zamkiem", opis, kategoria: "dorosli" })).toBe("Sweter męski cienki półgolf z zamkiem");
    expect(tytulDoFeedu({ nazwa: "Sweter męski rozpinany półgolf Ciepły podszyty polarem", opis, kategoria: "dorosli" })).toBe(
      "Sweter męski rozpinany półgolf Ciepły podszyty polarem",
    );
    expect(tytulDoFeedu({ nazwa: "Sweterek dla chłopca", opis, kategoria: "chlopcy" })).toBe("Sweterek dla chłopca");
    expect(tytulDoFeedu({ nazwa: "Sweter męski rozpinany", opis: "Gruby, ciepły sweter", kategoria: "dorosli" })).toBe("Sweter męski rozpinany");
  });
});
