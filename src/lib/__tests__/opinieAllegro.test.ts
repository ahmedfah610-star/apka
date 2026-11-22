import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (f: unknown) => f, revalidateTag: () => {} }));
vi.mock("@/lib/supabase", () => ({ sbService: () => null }));
vi.mock("@/lib/allegro", () => ({ aktualnyToken: async () => null, allegroGet: async () => ({}), bezTokenow: (t: string) => t }));

import { maskujLogin, opinieDoProduktu, zOceny, zPodsumowania, type OpiniaAllegro } from "@/lib/opinieAllegro";

describe("opinie z Allegro na stronie", () => {
  it("login kupującego zamaskowany", () => {
    expect(maskujLogin("kasia_123")).toBe("k***3");
    expect(maskujLogin("ab")).toBe("a***");
    expect(maskujLogin("")).toBe("k***");
  });

  it("ocena z API → opinia: treść, polecenie, odpowiedź sklepu, produkt ze sklepu po ofercie", () => {
    const o = zOceny(
      {
        id: "r1",
        createdAt: "2026-11-18T10:00:00Z",
        buyer: { id: "1", login: "mama_ola" },
        recommended: false,
        comment: { text: "  Czapka   trochę za mała. " },
        answer: { text: "Wymieniliśmy na większą.", createdAt: "2026-11-19T10:00:00Z", language: "pl" },
        order: { id: "z1", offers: [{ id: "111", title: "Czapka" }, { id: "999", title: "Inna" }] },
      },
      new Map([["111", "al-m-czapka"]]),
    )!;
    expect(o).toMatchObject({ id: "r1", login: "m***a", polecam: false, tekst: "Czapka trochę za mała.", odpowiedz: "Wymieniliśmy na większą.", produkty: ["al-m-czapka"] });
  });

  it("ocena bez treści nie trafia na listę (liczy się tylko w podsumowaniu)", () => {
    expect(zOceny({ id: "r2", recommended: true, buyer: { login: "x" }, order: { offers: [] } }, new Map())).toBeNull();
  });

  it("podsumowanie jak na Allegro (procent z Allegro, bez wymyślonej średniej gwiazdek)", () => {
    const p = zPodsumowania({
      recommended: { unique: 2300, total: 2408 },
      notRecommended: { unique: 9, total: 10 },
      recommendedPercentage: "99,6",
      statistics: { received: { total: 2418 }, excluded: { total: 3 }, removed: { total: 1 } },
      user: { createdAt: "2019-03-01" },
    });
    expect(p).toEqual({ procentPolecen: "99,6", ocen: 2418, polecajacych: 2408, niepolecajacych: 10, odKiedy: "2019-03-01" });
  });

  it("karta produktu: najpierw opinie o tym produkcie, potem najnowsze — także negatywne", () => {
    const o = (id: string, produkty: string[], polecam = true): OpiniaAllegro => ({ id, data: "2026-11-01", login: "a***b", polecam, tekst: id, odpowiedz: null, produkty });
    const wszystkie = [o("1", []), o("2", [], false), o("3", ["p1"]), o("4", [])];
    expect(opinieDoProduktu(wszystkie, ["p1"], 3).map((x) => x.id)).toEqual(["3", "1", "2"]);
  });
});
