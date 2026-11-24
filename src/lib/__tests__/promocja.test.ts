import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ZIMA5 i BOBAS5: −5% od wartości produktów (dostawa bez rabatu), bez minimum, od 12.11.2026 do 20.02.2027 włącznie,
// ukryte na stronie (działają po wpisaniu), każdy kod: 100 opłaconych zamówień i raz na numer telefonu.
let wierszZBazy: Record<string, unknown> | null = null;
let uzycia: { tel: string | null }[] = []; // zamowienia.select("tel:klient->>telefon")
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: wierszZBazy, error: null }),
          not: () => ({ limit: async () => ({ data: uzycia, error: null }) }),
        }),
      }),
    }),
  }),
}));

const sprawdz = async (kod: string, suma: number, telefon?: string) => (await import("@/lib/kodyDb")).sprawdzKod(kod, suma, undefined, telefon);

describe("kody ZIMA5 i BOBAS5", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-20T12:00:00+01:00"));
    wierszZBazy = null;
    uzycia = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("5% od wartości produktów, bez minimum — oba kody", async () => {
    expect((await sprawdz("zima5", 100)).rabat).toBe(5);
    expect((await sprawdz("BOBAS5", 9.99)).rabat).toBe(0.5);
    expect((await sprawdz("CIEPLO5", 50)).ok).toBe(false);
  });

  it("NADROBIMY10 (przeprosiny w mailach): −10%, bez minimum i daty końca, raz na numer telefonu", async () => {
    vi.setSystemTime(new Date("2026-11-25T12:00:00+01:00"));
    expect((await sprawdz("nadrobimy10", 59.9)).rabat).toBe(5.99);
    vi.setSystemTime(new Date("2028-06-01T12:00:00+02:00"));
    expect((await sprawdz("NADROBIMY10", 30)).ok).toBe(true);
    uzycia = [{ tel: "500600700" }];
    const drugi = await sprawdz("NADROBIMY10", 30, "+48 500 600 700");
    expect(drugi.ok).toBe(false);
    expect(drugi.blad).toBe("Kod NADROBIMY10 został już wykorzystany.");
    expect((await sprawdz("NADROBIMY10", 30, "511222333")).rabat).toBe(3);
  });

  it("ważne do 20.02.2027 23:59:59 włącznie, nie przed 12.11.2026", async () => {
    vi.setSystemTime(new Date("2026-11-11T23:59:00+01:00"));
    expect((await sprawdz("ZIMA5", 100)).ok).toBe(false);
    vi.setSystemTime(new Date("2027-02-20T23:59:00+01:00"));
    expect((await sprawdz("BOBAS5", 100)).ok).toBe(true);
    vi.setSystemTime(new Date("2027-02-21T00:00:01+01:00"));
    const po = await sprawdz("BOBAS5", 100);
    expect(po.ok).toBe(false);
    expect(po.blad).toMatch(/zakończyła/);
  });

  it("pula 100 osób: 99 użyć → działa, 100 → wykorzystana", async () => {
    uzycia = Array.from({ length: 99 }, (_, i) => ({ tel: String(600000000 + i) }));
    expect((await sprawdz("ZIMA5", 100, "511111111")).ok).toBe(true);
    uzycia.push({ tel: "699999999" });
    const w = await sprawdz("ZIMA5", 100, "511111111");
    expect(w.ok).toBe(false);
    expect(w.blad).toMatch(/wykorzystana/);
  });

  it("raz na numer: ten sam numer w innym zapisie → odmowa; podgląd bez numeru → ok; zamówienie bez numeru → prośba", async () => {
    uzycia = [{ tel: "+48 500-600-700" }, { tel: null }];
    const w = await sprawdz("BOBAS5", 100, "0048500600700");
    expect(w.ok).toBe(false);
    expect(w.blad).toMatch(/został już wykorzystany\./);
    expect((await sprawdz("BOBAS5", 100, "501 222 333")).ok).toBe(true);
    expect((await sprawdz("BOBAS5", 100)).ok).toBe(true); // podgląd w koszyku — numer sprawdzi zamówienie
    expect((await sprawdz("BOBAS5", 100, "")).blad).toBe("Podaj numer telefonu (9 cyfr).");
  });

  it("numer telefonu: ostatnie 9 cyfr", async () => {
    const { numerTelefonu } = await import("@/lib/promocja");
    expect(numerTelefonu("+48 500 600 700")).toBe("500600700");
    expect(numerTelefonu("500-600-700")).toBe("500600700");
    expect(numerTelefonu("12345")).toBe("");
  });

  it("kod o tej nazwie dodany w panelu ma pierwszeństwo", async () => {
    wierszZBazy = { kod: "ZIMA5", typ: "procent", wartosc: 10, min_koszyk: 0, aktywny: true, wazny_do: null, limit_uzyc: null, uzyto: 0 };
    expect((await sprawdz("ZIMA5", 50)).rabat).toBe(5);
  });

  it("stan promocji: z datą końca kończy się po niej; bez daty trwa", async () => {
    const { stanPromocji } = await import("@/lib/promocja");
    const baza = { kod: "X", procent: 5, minKoszyk: 0, od: "2026-11-12T00:00:00+01:00", widoczna: true, limitUzyc: null, razNaTelefon: false };
    const t = (d: string) => new Date(d).getTime();
    expect(stanPromocji({ ...baza, do: null }, t("2027-06-01T00:00:00+01:00"))).toBe("trwa");
    expect(stanPromocji({ ...baza, do: null }, t("2026-11-11T12:00:00+01:00"))).toBe("przed");
    expect(stanPromocji({ ...baza, do: "2026-11-14T10:00:00+01:00" }, t("2026-11-14T10:00:01+01:00"))).toBe("po");
  });

  it("oba kody ukryte: sklep nie pokazuje promocji, warunki bez minimum", async () => {
    const { PROMOCJA, PROMOCJE, promocjaWidoczna, warunkiPromocji, zakresPromocji } = await import("@/lib/promocja");
    expect(PROMOCJA).toBeNull();
    expect(promocjaWidoczna()).toBeNull();
    expect(PROMOCJE.map((p) => p.kod)).toEqual(["ZIMA5", "BOBAS5", "NADROBIMY10"]);
    expect(zakresPromocji(PROMOCJE[0])).toBe("na wszystko");
    expect(warunkiPromocji(PROMOCJE[0])).toMatch(/bez minimalnej kwoty/);
  });
});
