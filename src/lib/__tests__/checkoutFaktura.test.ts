import { beforeEach, describe, expect, it, vi } from "vitest";

// Zamówienie z fakturą: dane zapisują się w zamówieniu, a płatność Przelewy24 działa tak samo
// jak bez faktury. Błędne dane do faktury zatrzymują zamówienie PRZED zapisem i płatnością.
const zapisane: Record<string, unknown>[] = [];
const platnosci: { sessionId: string; amount: number; email: string }[] = [];

vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [{ id: "p1", nazwa: "Komplet", cena: 59.99, kategoria: "niemowleta", rozmiary: ["68"], stanRozmiary: { "68": 3 }, stan: 3, kolor: "szary", zdjecie: null }],
}));
vi.mock("@/lib/dostawaDb", () => ({
  pobierzDostawe: async () => ({ metody: [{ id: "paczkomat", nazwa: "InPost Paczkomat 24/7", opis: "", cena: 13.99, paczkomat: true }], darmowaOd: 150 }),
}));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { sessionId: string; amount: number; email: string }) => (platnosci.push(p), { ok: true, url: `https://p24.test/${p.sessionId}` }),
}));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      insert: (w: Record<string, unknown>) => {
        zapisane.push(w);
        return { select: () => ({ single: async () => ({ data: { id: "11111111-2222-4333-8444-555555555555" }, error: null }) }) };
      },
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));

const KLIENT = { imie: "Anna Kwiatek", email: "anna@kwiatek.pl", paczkomat: "WAW123M", paczkomatOpis: "Warszawa" };
const FIRMA = { typ: "firma", nip: "526 025 02 74", nazwa: "Kwiatek i Syn Sp. z o.o.", adres: "ul. Lipowa 12/4", kod: "20001", miasto: "Lublin", uwagi: "Proszę o datę sprzedaży" };

let nr = 0;
async function zamow(extra: Record<string, unknown> = {}) {
  const { POST } = await import("@/app/api/platnosc/checkout/route");
  const res = await POST(
    new Request("https://bobas-shopping.pl/api/platnosc/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.7.0.${++nr}` },
      body: JSON.stringify({ pozycje: [{ id: "p1", rozmiar: "68", ilosc: 1 }], metodaId: "paczkomat", klient: KLIENT, ...extra }),
    }),
  );
  return { status: res.status, dane: (await res.json()) as { ok?: boolean; url?: string; blad?: string } };
}

beforeEach(() => {
  vi.resetModules();
  zapisane.length = 0;
  platnosci.length = 0;
});

describe("zamówienie z fakturą", () => {
  it("bez faktury — jak dotąd: zapis + płatność, brak danych faktury w zamówieniu", async () => {
    const r = await zamow();
    expect(r.dane).toMatchObject({ ok: true, url: "https://p24.test/11111111-2222-4333-8444-555555555555" });
    expect((zapisane[0].klient as Record<string, unknown>).faktura).toBeUndefined();
    expect(platnosci[0].amount).toBe(7398); // 59,99 + 13,99
  });

  it("faktura na firmę: dane zapisane w zamówieniu, płatność na tę samą kwotę", async () => {
    const r = await zamow({ faktura: FIRMA });
    expect(r.dane.ok).toBe(true);
    const k = zapisane[0].klient as Record<string, unknown>;
    expect(k.faktura).toEqual({
      typ: "firma",
      nip: "5260250274",
      nazwa: "Kwiatek i Syn Sp. z o.o.",
      adres: "ul. Lipowa 12/4",
      kod: "20-001",
      miasto: "Lublin",
      kraj: "PL",
      uwagi: "Proszę o datę sprzedaży",
    });
    expect(k.email).toBe("anna@kwiatek.pl"); // dane kontaktowe bez zmian
    expect(zapisane[0].status).toBe("oczekuje_na_platnosc");
    expect(platnosci).toHaveLength(1);
    expect(platnosci[0].amount).toBe(7398);
    expect(platnosci[0].email).toBe("anna@kwiatek.pl");
  });

  it("faktura imienna (osoba prywatna) przy paczkomacie", async () => {
    const r = await zamow({ faktura: { typ: "osoba", nazwa: "Anna Kwiatek", adres: "Polna 1", kod: "00-001", miasto: "Warszawa" } });
    expect(r.dane.ok).toBe(true);
    expect((zapisane[0].klient as { faktura: { typ: string; nip?: string } }).faktura).toMatchObject({ typ: "osoba", nazwa: "Anna Kwiatek" });
    expect((zapisane[0].klient as { faktura: { nip?: string } }).faktura.nip).toBeUndefined();
  });

  it("błędne dane do faktury — komunikat, BEZ zapisu zamówienia i BEZ płatności", async () => {
    for (const zla of [{ ...FIRMA, nip: "5260250275" }, { ...FIRMA, kod: "abc" }, { typ: "osoba", nazwa: "Anna Kwiatek" }]) {
      const r = await zamow({ faktura: zla });
      expect(r.status).toBe(400);
      expect(r.dane.ok).toBe(false);
      expect(r.dane.blad).toBeTruthy();
    }
    expect(zapisane).toHaveLength(0);
    expect(platnosci).toHaveLength(0);
  });

  it("null / false = bez faktury (nie psuje zamówienia)", async () => {
    expect((await zamow({ faktura: null })).dane.ok).toBe(true);
    expect((await zamow({ faktura: false })).dane.ok).toBe(true);
    expect(zapisane.every((z) => (z.klient as Record<string, unknown>).faktura === undefined)).toBe(true);
    expect(platnosci).toHaveLength(2);
  });
});
