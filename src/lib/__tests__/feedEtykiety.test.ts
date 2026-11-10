import { describe, expect, it } from "vitest";
import { etykietyReklamowe, sztukNaStanie } from "@/lib/feedEtykiety";

// Etykiety do kampanii Google Ads: reklamujemy droższe produkty z zapasem, osobno dziecięce i męskie.
describe("etykiety reklamowe w pliku produktowym", () => {
  it("cena: od 40 zł wzwyż", () => {
    expect(etykietyReklamowe({ cena: 39.99, kategoria: "niemowleta", stan: 5 } as never).cena).toBe("cena-ponizej-40");
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
});
