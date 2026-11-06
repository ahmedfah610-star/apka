import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ZIMA5: −5% od 50 zł (wartość produktów, bez dostawy), tylko 5.11 00:00 – 8.11 23:59 czasu polskiego.
let wierszZBazy: Record<string, unknown> | null = null;
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: wierszZBazy, error: null }) }) }) }),
  }),
}));

const sprawdz = async (kod: string, suma: number) => (await import("@/lib/kodyDb")).sprawdzKod(kod, suma);

describe("promocja ZIMA5", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    wierszZBazy = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("w trakcie: 5% od wartości produktów, od 50 zł", async () => {
    vi.setSystemTime(new Date("2026-11-07T12:00:00+01:00"));
    const r = await sprawdz("zima5", 100);
    expect(r.ok).toBe(true);
    expect(r.rabat).toBe(5);
    expect((await sprawdz("ZIMA5", 50)).rabat).toBe(2.5);
    expect((await sprawdz("ZIMA5", 89.99)).rabat).toBe(4.5); // 4,4995 → 4,50 zł
  });

  it("poniżej 50 zł — odmowa z informacją o minimum", async () => {
    vi.setSystemTime(new Date("2026-11-05T20:00:00+01:00"));
    const r = await sprawdz("ZIMA5", 49.99);
    expect(r.ok).toBe(false);
    expect(r.blad).toMatch(/50,00 zł/);
  });

  it("przed startem i po końcu — kod nie działa", async () => {
    vi.setSystemTime(new Date("2026-11-04T23:59:00+01:00"));
    expect((await sprawdz("ZIMA5", 100)).ok).toBe(false);
    vi.setSystemTime(new Date("2026-11-09T00:00:01+01:00"));
    const po = await sprawdz("ZIMA5", 100);
    expect(po.ok).toBe(false);
    expect(po.blad).toMatch(/zakończyła/);
  });

  it("ostatnia sekunda promocji jeszcze działa", async () => {
    vi.setSystemTime(new Date("2026-11-08T23:59:59+01:00"));
    expect((await sprawdz("ZIMA5", 100)).ok).toBe(true);
    expect((await sprawdz("BOCIAN5", 100)).ok).toBe(false); // stary kod już nie działa
  });

  it("kod o tej nazwie dodany w panelu ma pierwszeństwo", async () => {
    vi.setSystemTime(new Date("2026-11-07T12:00:00+01:00"));
    wierszZBazy = { kod: "ZIMA5", typ: "procent", wartosc: 10, min_koszyk: 0, aktywny: true, wazny_do: null, limit_uzyc: null, uzyto: 0 };
    expect((await sprawdz("ZIMA5", 50)).rabat).toBe(5);
  });
});
