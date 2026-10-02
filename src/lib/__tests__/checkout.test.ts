import { beforeEach, describe, expect, it, vi } from "vitest";

// Katalog z serwera: rozmiar 74 — 2 szt., 80 — wyprzedany.
vi.mock("@/lib/produktyDb", () => ({
  katalogWidoczny: async () => [
    { id: "p1", nazwa: "Body testowe", cena: 20, kategoria: "niemowleta", rozmiary: ["74", "80"], stanRozmiary: { "74": 2, "80": 0 }, stan: 2, kolor: "biały", zdjecie: null },
  ],
}));
vi.mock("@/lib/supabase", () => ({ supabaseWlaczony: () => false, sbService: () => null }));
vi.mock("@/lib/dostawaDb", () => ({ pobierzDostawe: async () => ({ metody: [], darmowaOd: 150 }) }));

let nr = 0;
async function zamow(pozycje: unknown[]) {
  const { POST } = await import("@/app/api/platnosc/checkout/route");
  const req = new Request("http://localhost/api/platnosc/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${++nr}` },
    body: JSON.stringify({ pozycje, metoda: "test", dostawa: 0 }),
  });
  const res = await POST(req);
  return { status: res.status, dane: (await res.json()) as { ok: boolean; blad?: string } };
}

describe("checkout — rozmiar i stan sprawdzane na serwerze", () => {
  beforeEach(() => vi.resetModules());
  it("przyjmuje dostępny rozmiar", async () => {
    expect((await zamow([{ id: "p1", rozmiar: "74", ilosc: 2 }])).dane.ok).toBe(true);
  });
  it("odrzuca nieistniejący rozmiar i brak rozmiaru", async () => {
    expect((await zamow([{ id: "p1", rozmiar: "999", ilosc: 1 }])).status).toBe(400);
    expect((await zamow([{ id: "p1", ilosc: 1 }])).status).toBe(400);
  });
  it("odrzuca więcej sztuk niż na stanie (także w kilku liniach)", async () => {
    expect((await zamow([{ id: "p1", rozmiar: "74", ilosc: 3 }])).status).toBe(409);
    expect((await zamow([{ id: "p1", rozmiar: "74", ilosc: 1 }, { id: "p1", rozmiar: "74", ilosc: 2 }])).status).toBe(409);
  });
  it("odrzuca wyprzedany rozmiar", async () => {
    const r = await zamow([{ id: "p1", rozmiar: "80", ilosc: 1 }]);
    expect(r.status).toBe(409);
    expect(r.dane.blad).toMatch(/wyprzedany/);
  });
});
