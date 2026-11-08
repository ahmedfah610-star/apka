import { beforeEach, describe, expect, it, vi } from "vitest";

// Kod powitalny NOWY5: −5% od produktów, bez minimum, raz na e-mail; mail z kodem i produktami;
// automat: konta sprzed 24–72 h bez zakupu i bez wysłanego kodu; ręczna wysyłka tylko przez admina.
let admin = true;
let uzyteNaEmail: string[] = [];
let uzytkownicy: Record<string, unknown>[] = [];
let kupujacy: string[] = [];
let wyslaneKody: { klucz: string; wartosc: { czas: string } }[] = [];
const upserty: Record<string, unknown>[] = [];
const maile: { to: string; subject: string; html: string }[] = [];

vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => admin }));
vi.mock("@/lib/mailLog", () => ({ zapiszMail: async () => {} }));
vi.mock("@/lib/hitTygodnia", async (orig) => ({ ...(await orig<object>()), sprzedazOstatnio: async () => new Map([["p-hit", 3]]) }));

const prod = (id: string, nazwa: string, extra: Record<string, unknown> = {}) => ({
  id, nazwa, cena: 29.99, kategoria: "niemowleta", zdjecie: `https://a.allegroimg.com/original/${id}.jpg`, rozmiary: ["68"], stanRozmiary: { "68": 1 }, stan: 1, ...extra,
});
const KATALOG = [
  prod("p-stary", "Body bawełniane"),
  prod("p-hit", "Komplet niemowlęcy"),
  prod("p-cieply", "Kombinezon zimowy ocieplany"),
  prod("p-dorosli", "Bluza damska", { kategoria: "dorosli" }),
  prod("p-brak", "Czapka", { stanRozmiary: { "68": 0 } }),
  prod("p-hit-zielony", "Komplet niemowlęcy"),
];
vi.mock("@/lib/produktyDb", () => ({ katalogWidoczny: async () => KATALOG }));

// Łańcuchowy mock zapytań Supabase: wynik zależy od tabeli.
function zapytanie(tabela: string) {
  const filtry: Record<string, unknown> = {};
  const q: Record<string, unknown> = {};
  const wynik = () => {
    if (tabela === "kody_rabatowe") return { data: null, error: null };
    if (tabela === "zamowienia" && filtry.kod) return { data: uzyteNaEmail.includes(String(filtry.ilike).toLowerCase()) ? [{ id: "z1" }] : [], error: null };
    if (tabela === "zamowienia") return { data: kupujacy.map((email) => ({ email })), error: null };
    if (tabela === "ustawienia") return { data: wyslaneKody, error: null };
    return { data: null, error: null };
  };
  for (const m of ["select", "in", "like", "order", "limit"]) q[m] = () => q;
  q.eq = (k: string, v: unknown) => ((filtry[k === "kod_rabatowy" ? "kod" : k] = v), q);
  q.ilike = (_k: string, v: unknown) => ((filtry.ilike = v), q);
  q.maybeSingle = async () => wynik();
  q.upsert = async (w: Record<string, unknown>) => (upserty.push(w), { error: null });
  q.then = (ok: (v: unknown) => unknown) => Promise.resolve(wynik()).then(ok);
  return q;
}
const sb = {
  from: zapytanie,
  rpc: async () => ({}),
  auth: {
    admin: {
      listUsers: async () => ({ data: { users: uzytkownicy }, error: null }),
      getUserById: async (id: string) => ({ data: { user: uzytkownicy.find((u) => u.id === id) ?? null }, error: null }),
    },
  },
};
vi.mock("@/lib/supabase", () => ({ supabaseWlaczony: () => true, sbService: () => sb }));

const godzinTemu = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const konto = (id: string, email: string, h: number, extra: Record<string, unknown> = {}) => ({
  id, email, created_at: godzinTemu(h), email_confirmed_at: godzinTemu(h), user_metadata: { imie: "Tomasz Nowak" }, ...extra,
});

beforeEach(() => {
  vi.resetModules();
  admin = true;
  uzyteNaEmail = [];
  kupujacy = [];
  wyslaneKody = [];
  upserty.length = 0;
  maile.length = 0;
  uzytkownicy = [konto("u-tomasz", "tomasz@example.com", 2)];
  process.env.RESEND_API_KEY = "re_test";
  vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
    maile.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  });
});

describe("kod NOWY5 w koszyku", () => {
  it("−5% od produktów, bez minimalnej kwoty", async () => {
    const { sprawdzKod } = await import("@/lib/kodyDb");
    const a = await sprawdzKod("nowy5", 39.99, "tomasz@example.com");
    expect(a.ok).toBe(true);
    expect(a.rabat).toBe(2);
    const b = await sprawdzKod("NOWY5", 9.99);
    expect(b.ok).toBe(true);
    expect(b.rabat).toBe(0.5);
  });

  it("drugi raz na ten sam e-mail — odmowa", async () => {
    uzyteNaEmail = ["tomasz@example.com"];
    const { sprawdzKod } = await import("@/lib/kodyDb");
    const w = await sprawdzKod("NOWY5", 50, "tomasz@example.com");
    expect(w.ok).toBe(false);
    expect(w.blad).toMatch(/już wykorzystany/);
    expect((await sprawdzKod("NOWY5", 50, "inny@example.com")).ok).toBe(true);
  });
});

describe("komu automat wysyła kod", () => {
  it("potwierdzone konta sprzed 24–72 h, bez zakupu i bez wysłanego kodu", async () => {
    const { doWysylki } = await import("@/lib/kodPowitalny");
    const k = (id: string, h: number, extra = {}) => ({ id, email: `${id}@x.pl`, imie: "", utworzono: godzinTemu(h), potwierdzone: true, kupil: false, kodWyslany: null, ...extra });
    const wynik = doWysylki([
      k("swiezy", 5),
      k("ok", 30),
      k("ok2", 70),
      k("stary", 100),
      k("kupil", 30, { kupil: true }),
      k("wyslany", 30, { kodWyslany: godzinTemu(1) }),
      k("niepotw", 30, { potwierdzone: false }),
    ]).map((x) => x.id);
    expect(wynik).toEqual(["ok", "ok2"]);
  });

  it("produkty w mailu: najpierw kupowane, zimą ciepłe, tylko dziecięce na stanie", async () => {
    const { polecaneProdukty } = await import("@/lib/kodPowitalny");
    const ids = polecaneProdukty(KATALOG as never, new Map([["p-hit", 3]]), 4, new Date("2026-11-08T12:00:00Z")).map((p) => p.id);
    expect(ids).toEqual(["p-hit", "p-cieply", "p-stary"]);
  });

  it("cron wysyła tylko kwalifikujące się konta i zapisuje znacznik", async () => {
    uzytkownicy = [konto("u-a", "a@example.com", 30), konto("u-b", "b@example.com", 30), konto("u-c", "c@example.com", 5)];
    kupujacy = ["b@example.com"];
    const { kodyPowitalneCron } = await import("@/lib/kodPowitalnyWysylka");
    const w = await kodyPowitalneCron(sb as never);
    expect(w).toMatchObject({ ok: true, wyslano: 1 });
    expect(maile.map((m) => m.to)).toEqual(["a@example.com"]);
    expect(upserty[0].klucz).toBe("kod-powitalny:u-a");
  });
});

describe("mail z kodem", () => {
  it("imię, kod, warunki, zdjęcia i linki do produktów", async () => {
    const { mailKodPowitalnyHtml } = await import("@/lib/mail");
    const html = mailKodPowitalnyHtml({
      imie: "Tomasz <Nowak>",
      kod: "NOWY5",
      procent: 5,
      produkty: [{ nazwa: "Komplet", cena: 39.99, zdjecie: "https://a.allegroimg.com/original/x.jpg", url: "https://bobas-shopping.pl/produkty/p-hit" }],
    });
    expect(html).toContain("Cześć Tomasz! Odbierz swój kod rabatowy");
    expect(html).toContain("NOWY5");
    expect(html).toContain("bez minimalnej kwoty");
    expect(html).toContain("dostawa się nie wlicza");
    expect(html).toContain('href="https://bobas-shopping.pl/produkty/p-hit"');
    expect(html).toContain("<img");
    expect(html).toContain("https://bobas-shopping.pl/produkty\"");
    expect(html).not.toContain("<Nowak>");
  });
});

describe("panel: ręczna wysyłka", () => {
  it("lista kont i wysyłka tylko dla admina", async () => {
    admin = false;
    const { GET, POST } = await import("@/app/api/admin/konta/route");
    expect((await GET()).status).toBe(401);
    expect((await POST(new Request("https://x/api/admin/konta", { method: "POST", body: JSON.stringify({ id: "u-tomasz" }) }))).status).toBe(401);
    expect(maile).toHaveLength(0);
  });

  it("wysyła Tomaszowi od razu (świeże konto) i oznacza", async () => {
    const { GET, POST } = await import("@/app/api/admin/konta/route");
    const lista = (await (await GET()).json()) as { items: { id: string; kupil: boolean; kodWyslany: string | null }[] };
    expect(lista.items[0]).toMatchObject({ id: "u-tomasz", kupil: false, kodWyslany: null });
    const r = await POST(new Request("https://x/api/admin/konta", { method: "POST", body: JSON.stringify({ id: "u-tomasz" }) }));
    expect(r.status).toBe(200);
    expect(maile[0].to).toBe("tomasz@example.com");
    expect(maile[0].subject).toContain("Tomasz, odbierz swój kod rabatowy −5%");
    expect(maile[0].html).toContain("<img");
    expect(upserty[0].klucz).toBe("kod-powitalny:u-tomasz");
  });
});
