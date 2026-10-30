import { beforeEach, describe, expect, it, vi } from "vitest";

// „Dokończ płatność": po pełnym id zamówienia (konto i strona powrotu, także bez konta),
// tylko zamówienie czekające na zapłatę, tylko dostępny towar, kwota i e-mail z zamówienia.
const ID = "7c41a2e9-5b1d-4e2a-9f3c-0d8e6a1b2c3d";
const teraz = new Date().toISOString();
let zamowienie: Record<string, unknown> | null;
const rejestracje: { sessionId: string; amount: number; email: string }[] = [];

vi.mock("@/lib/produktyDb", () => ({
  katalogWidoczny: async () => [
    { id: "p1", nazwa: "Body testowe", cena: 20, rozmiary: ["74", "80"], stanRozmiary: { "74": 2, "80": 0 }, stan: 2 },
  ],
}));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { sessionId: string; amount: number; email: string }) => {
    rejestracje.push(p);
    return { ok: true, url: `https://p24.test/trnRequest/${p.sessionId}` };
  },
}));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: zamowienie }) }) }),
    }),
  }),
}));

let nr = 0;
async function ponow(id = ID) {
  const { POST } = await import("@/app/api/platnosc/ponow/route");
  const res = await POST(
    new Request("https://bobas-shopping.pl/api/platnosc/ponow", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `10.1.0.${++nr}`,
      },
      body: JSON.stringify({ id }),
    }),
  );
  return { status: res.status, dane: (await res.json()) as { ok?: boolean; url?: string; blad?: string } };
}

const pozycja = (rozmiar: string, ilosc = 1) => ({ id: "p1", nazwa: "Body testowe", rozmiar, ilosc, cena: 20 });

describe("ponowna płatność z panelu klienta", () => {
  beforeEach(() => {
    vi.resetModules();
    rejestracje.length = 0;
    zamowienie = { id: ID, created_at: teraz, status: "oczekuje_na_platnosc", razem: 30.5, pozycje: [pozycja("74")], klient: { email: "anna@example.com" } };
  });

  it("nowa płatność na kwotę i e-mail z zamówienia (unikalne sessionId z id zamówienia), także bez konta", async () => {
    const r = await ponow();
    expect(r.status).toBe(200);
    expect(r.dane.url).toContain("p24.test");
    expect(rejestracje[0].amount).toBe(3050);
    expect(rejestracje[0].email).toBe("anna@example.com");
    expect(rejestracje[0].sessionId.startsWith(`${ID}_`)).toBe(true);
    expect(rejestracje[0].sessionId.split("_")[0]).toBe(ID);
  });

  it("nieistniejące zamówienie — 404, bez płatności", async () => {
    zamowienie = null;
    expect((await ponow()).status).toBe(404);
    expect(rejestracje).toHaveLength(0);
  });

  it("opłacone / anulowane — nie da się zapłacić drugi raz", async () => {
    for (const status of ["oplacone", "wyslane", "anulowane"]) {
      zamowienie = { ...zamowienie!, status };
      expect((await ponow()).status).toBe(409);
    }
    expect(rejestracje).toHaveLength(0);
  });

  it("wyprzedany towar — blokada płatności z komunikatem", async () => {
    zamowienie = { ...zamowienie!, pozycje: [pozycja("80")] };
    const r = await ponow();
    expect(r.status).toBe(409);
    expect(r.dane.blad).toMatch(/nie jest już dostępny/);
    zamowienie = { ...zamowienie!, pozycje: [pozycja("74", 3)] };
    expect((await ponow()).status).toBe(409);
  });

  it("zbyt stare zamówienie i błędne id", async () => {
    zamowienie = { ...zamowienie!, created_at: new Date(Date.now() - 20 * 86400000).toISOString() };
    expect((await ponow()).status).toBe(410);
    expect((await ponow("nie-uuid")).status).toBe(400);
  });
});
