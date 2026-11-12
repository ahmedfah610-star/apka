import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Płatność z kodem promocji ZIMA5 (−5% od produktów, bez minimum, do sob. 14.11 10:00):
// kwota zamówienia w bazie = kwota zarejestrowana w Przelewy24 = to, co klient widzi na ekranie.
const zapisane: Record<string, unknown>[] = [];
const p24: { amount: number; sessionId: string }[] = [];

vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [
    { id: "k1", nazwa: "Komplet testowy", cena: 39.99, kategoria: "niemowleta", rozmiary: ["74"], stanRozmiary: { "74": 10 }, stan: 10, kolor: null, zdjecie: null },
  ],
}));
vi.mock("@/lib/dostawaDb", () => ({
  pobierzDostawe: async () => ({ metody: [{ id: "pocztex", nazwa: "Pocztex (punkt odbioru)", opis: "", cena: 7.26, punkt: true }], darmowaOd: 150 }),
}));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { amount: number; sessionId: string }) => (p24.push(p), { ok: true, url: "https://p24.test/pay" }),
}));
vi.mock("@/lib/platnosci", () => ({ stripe: () => null, stripeWlaczony: () => false, bazowyUrl: () => "https://bobas-shopping.pl" }));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: (t: string) => ({
      // kody_rabatowe: brak wpisu → kod promocji z lib/promocja
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      insert: (w: Record<string, unknown>) => {
        if (t === "zamowienia") zapisane.push(w);
        return { select: () => ({ single: async () => ({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: null }) }) };
      },
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));

let nr = 0;
async function zamow(ilosc: number, kod?: string) {
  const { POST } = await import("@/app/api/platnosc/checkout/route");
  const req = new Request("http://localhost/api/platnosc/checkout", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++nr}` },
    body: JSON.stringify({
      pozycje: [{ id: "k1", rozmiar: "74", ilosc }],
      metodaId: "pocztex",
      kod,
      klient: { imie: "Anna Test", email: "anna@example.com", punkt: "PP123", punktOpis: "Lublin", miasto: "Lublin" },
    }),
  });
  const res = await POST(req);
  return { status: res.status, dane: (await res.json()) as { ok: boolean; blad?: string; url?: string } };
}

describe("checkout z kodem ZIMA5", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00+01:00"));
    zapisane.length = 0;
    p24.length = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rabat 5% od produktów, dostawa bez rabatu; ta sama kwota w bazie i w Przelewy24", async () => {
    const r = await zamow(2, "zima5");
    expect(r.dane.ok).toBe(true);
    const z = zapisane[0] as { suma: number; rabat: number; dostawa: number; razem: number; kod_rabatowy: string; status: string };
    expect(z).toMatchObject({ suma: 79.98, rabat: 4, dostawa: 7.26, razem: 83.24, kod_rabatowy: "ZIMA5", status: "oczekuje_na_platnosc" });
    expect(p24[0].amount).toBe(8324);
  });

  it("bez minimum: jeden tani produkt też dostaje rabat", async () => {
    await zamow(1, "ZIMA5");
    const z = zapisane[0] as { rabat: number; razem: number };
    expect(z.rabat).toBe(2); // 39,99 × 5% = 1,9995 → 2,00 zł
    expect(z.razem).toBe(45.25);
    expect(p24[0].amount).toBe(4525);
  });

  it("darmowa dostawa liczona od wartości produktów przed rabatem (jak w koszyku)", async () => {
    await zamow(4, "ZIMA5"); // 159,96 zł ≥ 150 zł
    const z = zapisane[0] as { dostawa: number; rabat: number; razem: number };
    expect(z).toMatchObject({ dostawa: 0, rabat: 8, razem: 151.96 });
    expect(p24[0].amount).toBe(15196);
  });

  it("promocja skończyła się w trakcie zamawiania → zamówienie wstrzymane z komunikatem (nie pełna kwota po cichu)", async () => {
    vi.setSystemTime(new Date("2026-11-14T10:00:01+01:00"));
    const r = await zamow(2, "ZIMA5");
    expect(r.status).toBe(400);
    expect(r.dane.blad).toMatch(/zakończyła.*Usuń kod/);
    expect(zapisane).toHaveLength(0);
    expect(p24).toHaveLength(0);
  });

  it("nieistniejący kod → komunikat zamiast zamówienia bez rabatu", async () => {
    const r = await zamow(1, "BLEDNY1");
    expect(r.status).toBe(400);
    expect(r.dane.blad).toMatch(/Nieprawidłowy kod/);
    expect(zapisane).toHaveLength(0);
  });

  it("bez kodu — pełna cena", async () => {
    await zamow(2);
    expect((zapisane[0] as { razem: number }).razem).toBe(87.24);
    expect(p24[0].amount).toBe(8724);
  });
});
