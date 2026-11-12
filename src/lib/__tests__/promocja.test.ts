import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// CIEPLO5: −5% od wartości produktów (dostawa bez rabatu), BEZ minimum, 12.11 00:00 – 16.11 23:59 czasu polskiego.
let wierszZBazy: Record<string, unknown> | null = null;
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: wierszZBazy, error: null }) }) }) }),
  }),
}));

const sprawdz = async (kod: string, suma: number) => (await import("@/lib/kodyDb")).sprawdzKod(kod, suma);

describe("promocja CIEPLO5", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    wierszZBazy = null;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("w trakcie: 5% od wartości produktów, bez minimum", async () => {
    vi.setSystemTime(new Date("2026-11-14T12:00:00+01:00"));
    expect((await sprawdz("cieplo5", 100)).rabat).toBe(5);
    expect((await sprawdz("CIEPLO5", 9.99)).rabat).toBe(0.5); // 0,4995 → 0,50 zł
    expect((await sprawdz("CIEPLO5", 89.99)).rabat).toBe(4.5);
  });

  it("przed startem i po końcu — kod nie działa", async () => {
    vi.setSystemTime(new Date("2026-11-11T23:59:00+01:00"));
    expect((await sprawdz("CIEPLO5", 100)).ok).toBe(false);
    vi.setSystemTime(new Date("2026-11-17T00:00:01+01:00"));
    const po = await sprawdz("CIEPLO5", 100);
    expect(po.ok).toBe(false);
    expect(po.blad).toMatch(/zakończyła/);
  });

  it("pierwsza i ostatnia sekunda promocji działają; stary kod nie", async () => {
    vi.setSystemTime(new Date("2026-11-12T00:00:00+01:00"));
    expect((await sprawdz("CIEPLO5", 50)).ok).toBe(true);
    vi.setSystemTime(new Date("2026-11-16T23:59:59+01:00"));
    expect((await sprawdz("CIEPLO5", 50)).ok).toBe(true);
    expect((await sprawdz("ZIMA5", 50)).ok).toBe(false);
  });

  it("kod o tej nazwie dodany w panelu ma pierwszeństwo", async () => {
    vi.setSystemTime(new Date("2026-11-14T12:00:00+01:00"));
    wierszZBazy = { kod: "CIEPLO5", typ: "procent", wartosc: 10, min_koszyk: 0, aktywny: true, wazny_do: null, limit_uzyc: null, uzyto: 0 };
    expect((await sprawdz("CIEPLO5", 50)).rabat).toBe(5);
  });

  it("teksty warunków bez minimum", async () => {
    const { warunkiPromocji, zakresPromocji, PROMOCJA } = await import("@/lib/promocja");
    expect(zakresPromocji(PROMOCJA!)).toBe("na wszystko");
    expect(warunkiPromocji(PROMOCJA!)).toMatch(/bez minimalnej kwoty/);
  });
});
