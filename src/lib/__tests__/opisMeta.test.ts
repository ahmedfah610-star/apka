import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase", () => ({ sbService: () => null }));
import { opisMetaProduktu, OPIS_SKLEPU } from "@/lib/seo";

describe("opisy do wyników Google", () => {
  it("produkt: nazwa, kolor, cena, rozmiary, zachęta — do 160 znaków", () => {
    const t = opisMetaProduktu({ nazwa: "Dres komplet dla chłopca bluza spodnie", cena: 59.99, kolor: "niebieski" }, ["92", "104", "116"]);
    expect(t).toBe("Dres komplet dla chłopca bluza spodnie, niebieski — 59,99 zł. Rozmiary: 92, 104, 116. Wymiary w cm w opisie, wysyłka w 1–2 dni. Zamów online!");
    expect(t.length).toBeLessThanOrEqual(160);
  });
  it("dużo rozmiarów — zakres; bardzo długa nazwa — skraca, ale zostaje cena i zachęta", () => {
    expect(opisMetaProduktu({ nazwa: "Body", cena: 9.99 }, ["56", "62", "68", "74", "80"])).toContain("Rozmiary: 56–80.");
    const t = opisMetaProduktu({ nazwa: "X".repeat(140), cena: 10 }, ["56"]);
    expect(t.length).toBeLessThanOrEqual(160);
  });
  it("opis sklepu bez nazwy spółki i miasta", () => {
    expect(OPIS_SKLEPU).not.toMatch(/Lublin|AMIN/);
    expect(OPIS_SKLEPU.length).toBeLessThanOrEqual(165);
  });
});
