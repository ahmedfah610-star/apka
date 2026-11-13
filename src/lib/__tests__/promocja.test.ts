import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ZIMA5: −5% od wartości produktów (dostawa bez rabatu), BEZ minimum, od 12.11 00:00 czasu polskiego, bez daty końca.
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

  it("w trakcie: 5% od wartości produktów, bez minimum", async () => {
    vi.setSystemTime(new Date("2026-11-13T12:00:00+01:00"));
    expect((await sprawdz("zima5", 100)).rabat).toBe(5);
    expect((await sprawdz("ZIMA5", 9.99)).rabat).toBe(0.5); // 0,4995 → 0,50 zł
    expect((await sprawdz("ZIMA5", 89.99)).rabat).toBe(4.5);
  });

  it("przed startem nie działa; po dawnym końcu (sobota 10:00) dalej działa — promocja bez daty końca", async () => {
    vi.setSystemTime(new Date("2026-11-11T23:59:00+01:00"));
    expect((await sprawdz("ZIMA5", 100)).ok).toBe(false);
    vi.setSystemTime(new Date("2026-11-12T00:00:00+01:00"));
    expect((await sprawdz("ZIMA5", 50)).ok).toBe(true);
    vi.setSystemTime(new Date("2026-11-14T10:00:01+01:00"));
    expect((await sprawdz("ZIMA5", 100)).rabat).toBe(5);
    vi.setSystemTime(new Date("2026-12-20T12:00:00+01:00"));
    expect((await sprawdz("ZIMA5", 100)).ok).toBe(true);
    expect((await sprawdz("CIEPLO5", 50)).ok).toBe(false);
  });

  it("stan promocji: bez daty końca trwa, z datą końca — kończy się po niej", async () => {
    const { stanPromocji } = await import("@/lib/promocja");
    const baza = { kod: "X", procent: 5, minKoszyk: 0, od: "2026-11-12T00:00:00+01:00" };
    const t = (d: string) => new Date(d).getTime();
    expect(stanPromocji({ ...baza, do: null }, t("2027-01-01T00:00:00+01:00"))).toBe("trwa");
    expect(stanPromocji({ ...baza, do: null }, t("2026-11-11T12:00:00+01:00"))).toBe("przed");
    expect(stanPromocji({ ...baza, do: "2026-11-14T10:00:00+01:00" }, t("2026-11-14T10:00:00+01:00"))).toBe("trwa");
    expect(stanPromocji({ ...baza, do: "2026-11-14T10:00:00+01:00" }, t("2026-11-14T10:00:01+01:00"))).toBe("po");
  });

  it("kod o tej nazwie dodany w panelu ma pierwszeństwo", async () => {
    vi.setSystemTime(new Date("2026-11-13T12:00:00+01:00"));
    wierszZBazy = { kod: "ZIMA5", typ: "procent", wartosc: 10, min_koszyk: 0, aktywny: true, wazny_do: null, limit_uzyc: null, uzyto: 0 };
    expect((await sprawdz("ZIMA5", 50)).rabat).toBe(5);
  });

  it("teksty warunków bez minimum", async () => {
    const { warunkiPromocji, zakresPromocji, PROMOCJA } = await import("@/lib/promocja");
    expect(zakresPromocji(PROMOCJA!)).toBe("na wszystko");
    expect(warunkiPromocji(PROMOCJA!)).toMatch(/bez minimalnej kwoty/);
  });
});
