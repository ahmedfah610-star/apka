import { beforeEach, describe, expect, it, vi } from "vitest";

// Przypomnienie o płatności: mail z linkiem prosto do Przelewy24 + koszyk, dostawa i dane klienta;
// link /zamowienie/zaplac przekierowuje od razu do płatności; wysyłka tylko z panelu (admin).
const ID = "31d013de-5b1d-4e2a-9f3c-0d8e6a1b2c3d";
let admin = true;
let zamowienie: Record<string, unknown> | null;
const rejestracje: { sessionId: string; amount: number; email: string }[] = [];
const maile: { to: string; subject: string; html: string; reply_to?: string }[] = [];
const aktualizacje: Record<string, unknown>[] = [];

vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => admin }));
vi.mock("@/lib/mailLog", () => ({ zapiszMail: async () => {} }));
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [{ id: "komplet-1", nazwa: "Komplet", cena: 39.99, stanRozmiary: { "68": 1 }, stan: 1 }],
}));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { sessionId: string; amount: number; email: string }) => {
    rejestracje.push(p);
    return { ok: true, url: `https://secure.przelewy24.pl/trnRequest/${p.sessionId}` };
  },
}));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: zamowienie }) }) }),
      update: (z: Record<string, unknown>) => ({ eq: async () => (aktualizacje.push(z), { error: null }) }),
    }),
  }),
}));

const klient = {
  imie: "Katarzyna Testowa",
  email: "kasia@example.com",
  telefon: "600100200",
  paczkomat: "CEA01M",
  paczkomatOpis: "Cerekwica 5D, 88-400 Cerekwica",
};
const noweZamowienie = () => ({
  id: ID,
  created_at: new Date().toISOString(),
  status: "oczekuje_na_platnosc",
  suma: 39.99,
  dostawa: 14.6,
  razem: 54.59,
  rabat: 0,
  kod_rabatowy: null,
  metoda: "InPost Paczkomat 24/7 · Przelewy24",
  pozycje: [{ id: "komplet-1", nazwa: "Komplet niemowlęcy body <b>", cena: 39.99, ilosc: 1, rozmiar: "68", kolor: "czerwony", zdjecie: "https://a.allegroimg.com/original/x.jpg" }],
  klient: { ...klient },
});

let nr = 0;
beforeEach(() => {
  vi.resetModules();
  admin = true;
  zamowienie = noweZamowienie();
  rejestracje.length = 0;
  maile.length = 0;
  aktualizacje.length = 0;
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_FROM = "bobas <sklep@bobas-shopping.pl>";
  vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
    maile.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "abc" }), { status: 200 });
  });
});

describe("treść maila z przypomnieniem", () => {
  it("link płatności, kwota, produkty, dostawa i dane z zamówienia", async () => {
    const { mailPrzypomnieniaHtml } = await import("@/lib/mail");
    const z = noweZamowienie();
    const html = mailPrzypomnieniaHtml({ ...z, data: z.created_at, kod: null, klient } as never);
    expect(html).toContain("Twoje zamówienie czeka na dokończenie!");
    expect(html).toContain(`https://bobas-shopping.pl/zamowienie/zaplac?id=${ID}`);
    expect(html).toContain("ZAPŁAĆ 54,59 ZŁ");
    expect(html).toContain("54,59 zł");
    expect(html).toContain("39,99 zł");
    expect(html).toContain("14,60 zł");
    expect(html).toContain("InPost Paczkomat 24/7");
    expect(html).not.toContain("· Przelewy24</td>");
    expect(html).toContain("czerwony");
    expect(html).toContain("68");
    expect(html).toContain("CEA01M");
    expect(html).toContain("Cerekwica 5D");
    expect(html).toContain("600100200");
    expect(html).toContain("Cześć Katarzyna!");
    expect(html).not.toContain("body <b>"); // treść z bazy jest escapowana
  });
});

describe("link /zamowienie/zaplac", () => {
  async function zaplac(id: string) {
    const { GET } = await import("@/app/zamowienie/zaplac/route");
    return GET(new Request(`https://bobas-shopping.pl/zamowienie/zaplac?id=${id}`, { headers: { "x-forwarded-for": `10.9.0.${++nr}` } }));
  }

  it("od razu przekierowuje do Przelewy24 na kwotę z zamówienia", async () => {
    const r = await zaplac(ID);
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toMatch(/^https:\/\/secure\.przelewy24\.pl\/trnRequest\//);
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(rejestracje[0].amount).toBe(5459);
    expect(rejestracje[0].email).toBe("kasia@example.com");
  });

  it("opłacone zamówienie — strona statusu zamiast drugiej płatności", async () => {
    zamowienie = { ...zamowienie!, status: "oplacone" };
    const r = await zaplac(ID);
    expect(r.headers.get("location")).toContain(`/zamowienie/dziekujemy?zamowienie=${ID}`);
    expect(rejestracje).toHaveLength(0);
  });

  it("błędny identyfikator — strona sprawdzania statusu", async () => {
    const r = await zaplac("abc");
    expect(r.headers.get("location")).toContain("/status-zamowienia");
    expect(rejestracje).toHaveLength(0);
  });
});

describe("wysyłka przypomnienia z panelu", () => {
  async function wyslij(body: unknown) {
    const { POST } = await import("@/app/api/zamowienia/route");
    const r = await POST(new Request("https://bobas-shopping.pl/api/zamowienia", { method: "POST", body: JSON.stringify(body) }));
    return { status: r.status, dane: (await r.json()) as { ok?: boolean; blad?: string; przypomnienie?: string } };
  }

  it("tylko dla admina", async () => {
    admin = false;
    expect((await wyslij({ id: ID, akcja: "przypomnienie" })).status).toBe(401);
    expect(maile).toHaveLength(0);
  });

  it("wysyła maila do klienta i zapisuje czas w zamówieniu (dane klienta zostają)", async () => {
    const r = await wyslij({ id: ID, akcja: "przypomnienie" });
    expect(r.dane.ok).toBe(true);
    expect(maile).toHaveLength(1);
    expect(maile[0].to).toBe("kasia@example.com");
    expect(maile[0].subject).toContain("czeka na dokończenie");
    expect(maile[0].reply_to).toBe("amin.kids1@hotmail.com");
    expect(maile[0].html).toContain(`/zamowienie/zaplac?id=${ID}`);
    const k = aktualizacje[0].klient as Record<string, unknown>;
    expect(k.paczkomat).toBe("CEA01M");
    expect(typeof k.przypomnienie).toBe("string");
  });

  it("nie wysyła, gdy zamówienie już opłacone, za stare albo bez e-maila", async () => {
    zamowienie = { ...noweZamowienie(), status: "oplacone" };
    expect((await wyslij({ id: ID, akcja: "przypomnienie" })).status).toBe(409);
    zamowienie = { ...noweZamowienie(), created_at: new Date(Date.now() - 15 * 86400000).toISOString() };
    expect((await wyslij({ id: ID, akcja: "przypomnienie" })).status).toBe(410);
    zamowienie = { ...noweZamowienie(), klient: { imie: "X" } };
    expect((await wyslij({ id: ID, akcja: "przypomnienie" })).status).toBe(400);
    expect(maile).toHaveLength(0);
  });
});
