import { describe, expect, it } from "vitest";
import { rankingPoOpiniach } from "@/lib/providersService";
import type { Uslugodawca } from "@/types/domain";

function uslugodawca(overrides: Partial<Uslugodawca>): Uslugodawca {
  return {
    id: "x",
    typ: "weterynarz",
    nazwa: "Test",
    miasto: "Warszawa",
    adres: "ul. Testowa 1",
    specjalizacje: [],
    ocenaSrednia: 4.5,
    liczbaOpinii: 10,
    opinie: [],
    ...overrides,
  };
}

describe("rankingPoOpiniach", () => {
  it("wysoka ocena z wieloma opiniami wygrywa z taką samą oceną z mała liczbą opinii", () => {
    const maloOpinii = uslugodawca({ id: "a", ocenaSrednia: 4.9, liczbaOpinii: 2 });
    const duzoOpinii = uslugodawca({ id: "b", ocenaSrednia: 4.9, liczbaOpinii: 300 });

    const wynik = rankingPoOpiniach([maloOpinii, duzoOpinii]);
    expect(wynik[0].id).toBe("b");
  });

  it("bardzo wysoka ocena z rozsądną liczbą opinii może wygrać z niższą oceną mającą więcej opinii", () => {
    const lepsza = uslugodawca({ id: "a", ocenaSrednia: 4.9, liczbaOpinii: 100 });
    const slabsza = uslugodawca({ id: "b", ocenaSrednia: 3.5, liczbaOpinii: 500 });

    const wynik = rankingPoOpiniach([slabsza, lepsza]);
    expect(wynik[0].id).toBe("a");
  });
});
