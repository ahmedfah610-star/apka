import { beforeEach, describe, expect, it, vi } from "vitest";

// Pulpit „Oferty z Allegro, których nie ma w sklepie": licznik z raportu synchronizacji
// poprawiany od razu po sprawdzeniu / pobraniu nowych ofert.
let raport: Record<string, unknown> | null;
vi.mock("@/lib/supabase", () => ({
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: raport ? { wartosc: raport } : null }) }) }),
      update: (w: { wartosc: Record<string, unknown> }) => ({ eq: async () => ((raport = w.wartosc), { error: null }) }),
    }),
  }),
}));

describe("licznik nowych ofert na Pulpicie", () => {
  beforeEach(() => {
    raport = {
      ok: true,
      czas: "2026-11-11T08:33:00Z",
      niedopasowane: 3,
      niedopasowaneLista: [
        { oferta: "1", nazwa: "A", rozmiar: "86" },
        { oferta: "2", nazwa: "B", rozmiar: null },
        { oferta: "3", nazwa: "C", rozmiar: "92" },
      ],
    };
  });

  it("sprawdzenie na żywo ustawia liczbę z listy kandydatów (0 = Pulpit już nic nie pokazuje)", async () => {
    const { odswiezLicznikNowych } = await import("@/lib/allegroNowe");
    await odswiezLicznikNowych({ kandydaci: [] });
    expect(raport?.niedopasowane).toBe(0);
    expect(raport?.niedopasowaneLista).toEqual([]);
    expect(raport?.ok).toBe(true);
  });

  it("pobrane oferty znikają z licznika", async () => {
    const { odswiezLicznikNowych } = await import("@/lib/allegroNowe");
    await odswiezLicznikNowych({ rozwiazane: ["1", "3"] });
    expect(raport?.niedopasowane).toBe(1);
    expect(raport?.niedopasowaneLista).toEqual([{ oferta: "2", nazwa: "B", rozmiar: null }]);
  });
});
