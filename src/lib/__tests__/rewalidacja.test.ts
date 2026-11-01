import { beforeEach, describe, expect, it, vi } from "vitest";

const sciezki: string[] = [];
const tagi: string[] = [];
vi.mock("next/cache", () => ({
  revalidatePath: (p: string, typ?: string) => sciezki.push(typ ? `${p} (${typ})` : p),
  revalidateTag: (t: string) => tagi.push(t),
  unstable_cache: (f: unknown) => f,
}));

describe("odświeżanie po zmianie stanów", () => {
  beforeEach(() => {
    sciezki.length = 0;
    tagi.length = 0;
  });

  it("zamówienie: tylko karty kupionych produktów + katalog", async () => {
    const { odswiezPoZmianieStanu, idZPozycji } = await import("@/lib/rewalidacja");
    odswiezPoZmianieStanu(idZPozycji([{ id: "al-m-1", ilosc: 1 }, { id: "al-m-2", ilosc: 2 }, { id: "al-m-1", ilosc: 1 }]));
    expect(tagi).toEqual(["katalog"]);
    expect(sciezki).toEqual(["/api/katalog", "/produkty/al-m-1", "/produkty/al-m-2", "/produkty", "/"]);
  });

  it("bez listy (panel) albo duża zmiana — wszystkie karty", async () => {
    const { odswiezPoZmianieStanu } = await import("@/lib/rewalidacja");
    odswiezPoZmianieStanu();
    expect(sciezki).toContain("/produkty/[id] (page)");
    sciezki.length = 0;
    odswiezPoZmianieStanu(Array.from({ length: 100 }, (_, i) => `p${i}`));
    expect(sciezki).toContain("/produkty/[id] (page)");
    expect(sciezki.filter((s) => s.startsWith("/produkty/p"))).toHaveLength(0);
  });

  it("dziwne pozycje nie psują odświeżenia", async () => {
    const { idZPozycji } = await import("@/lib/rewalidacja");
    expect(idZPozycji(null)).toEqual([]);
    expect(idZPozycji([{ nazwa: "x" }, { id: "a" }])).toEqual(["a"]);
  });
});
