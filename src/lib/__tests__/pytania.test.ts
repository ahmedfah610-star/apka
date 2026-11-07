import { beforeEach, describe, expect, it, vi } from "vitest";
import { liczbaNowych, nowyKlucz, PREFIKS_PYTANIA, sprawdzPytanie } from "@/lib/pytania";

// ── Udawana tabela `ustawienia` (tylko to, czego używa lib/pytania) ──
type Wiersz = { klucz: string; wartosc: any; zaktualizowano?: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
let tabela: Wiersz[] = [];
function zapytanie() {
  const filtry: ((w: Wiersz) => boolean)[] = [];
  let tryb: "select" | "update" | "delete" = "select";
  let zmiany: Partial<Wiersz> = {};
  const api: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const wynik = () => tabela.filter((w) => filtry.every((f) => f(w)));
  const wykonaj = async () => {
    if (tryb === "update") tabela = tabela.map((w) => (filtry.every((f) => f(w)) ? { ...w, ...zmiany } : w));
    if (tryb === "delete") tabela = tabela.filter((w) => !filtry.every((f) => f(w)));
    return { data: wynik(), error: null };
  };
  api.select = () => api;
  api.insert = async (w: Wiersz) => (tabela.push({ ...w }), { error: null });
  api.update = (z: Partial<Wiersz>) => ((tryb = "update"), (zmiany = z), api);
  api.delete = () => ((tryb = "delete"), api);
  api.eq = (k: string, v: unknown) => (filtry.push((w) => (w as any)[k] === v), tryb === "select" ? api : Object.assign(wykonaj(), api)); // eslint-disable-line @typescript-eslint/no-explicit-any
  api.like = (k: string, wz: string) => (filtry.push((w) => String((w as any)[k]).startsWith(wz.replace("%", ""))), api); // eslint-disable-line @typescript-eslint/no-explicit-any
  api.lt = (k: string, v: string) => (filtry.push((w) => String((w as any)[k]) < v), api); // eslint-disable-line @typescript-eslint/no-explicit-any
  api.neq = (k: string, v: unknown) => (filtry.push((w) => (k === "wartosc->>status" ? w.wartosc?.status : (w as any)[k]) !== v), wykonaj()); // eslint-disable-line @typescript-eslint/no-explicit-any
  api.order = () => api;
  api.limit = async () => ({ data: [...wynik()].sort((a, b) => b.klucz.localeCompare(a.klucz)), error: null });
  api.maybeSingle = async () => ({ data: wynik()[0] ?? null, error: null });
  api.then = (r: (v: unknown) => unknown) => wykonaj().then(r);
  return api;
}
vi.mock("@/lib/supabase", () => ({ supabaseWlaczony: () => true, sbService: () => ({ from: () => zapytanie() }) }));

// ── Udawany katalog i maile ──
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async (ids: string[]) =>
    ids.includes("al-m-komplet")
      ? [{ id: "al-m-komplet", nazwa: "Komplet welur", cena: 29.99, zdjecie: "https://a.allegroimg.com/original/x", rozmiary: ["56", "62"] }]
      : [],
}));
const maile: { typ: string; do?: string; tekst?: string }[] = [];
let mailOk = true;
vi.mock("@/lib/mail", () => ({
  wyslijPytanieDoSklepu: async () => void maile.push({ typ: "sklep" }),
  wyslijKopiePytania: async (p: { email: string }) => void maile.push({ typ: "kopia", do: p.email }),
  wyslijOdpowiedzNaPytanie: async (p: { email: string }, tekst: string) => {
    maile.push({ typ: "odpowiedz", do: p.email, tekst });
    return mailOk ? { ok: true } : { ok: false, blad: "Resend 500" };
  },
}));
let admin = true;
vi.mock("@/lib/adminAuth", () => ({
  czyAdmin: () => admin,
  odmowa: () => Response.json({ ok: false }, { status: 401 }),
}));

let nrIp = 0;
const zapytaj = async (body: unknown, ip = `10.0.0.${++nrIp}`) => {
  const { POST } = await import("@/app/api/pytanie/route");
  const r = await POST(new Request("http://x/api/pytanie", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }));
  return { status: r.status, dane: await r.json() };
};
const panel = async (metoda: "GET" | "POST", body?: unknown) => {
  const m = await import("@/app/api/admin/pytania/route");
  const r = metoda === "GET" ? await m.GET() : await m.POST(new Request("http://x", { method: "POST", body: JSON.stringify(body) }));
  return { status: r.status, dane: await r.json() };
};
const DOBRE = { produktId: "al-m-komplet", rozmiar: "62", email: "Anna@Example.com", tresc: "Który rozmiar na 70 cm?" };

beforeEach(() => {
  tabela = [];
  maile.length = 0;
  mailOk = true;
  admin = true;
});

describe("walidacja pytania", () => {
  it("poprawne pytanie — e-mail małymi literami, bez znaczników", () => {
    const w = sprawdzPytanie({ ...DOBRE, tresc: "<b>Jaki</b> rozmiar?" });
    expect(w.ok && w.dane).toEqual({ produktId: "al-m-komplet", rozmiar: "62", email: "anna@example.com", tresc: "bJaki/b rozmiar?" });
  });
  it("odrzuca brak treści, zły e-mail i dziwne id produktu", () => {
    expect(sprawdzPytanie({ ...DOBRE, tresc: "hej" }).ok).toBe(false);
    expect(sprawdzPytanie({ ...DOBRE, email: "anna@" }).ok).toBe(false);
    expect(sprawdzPytanie({ ...DOBRE, produktId: "../admin" }).ok).toBe(false);
  });
  it("przycina zbyt długą treść", () => {
    const w = sprawdzPytanie({ ...DOBRE, tresc: "a".repeat(5000) });
    expect(w.ok && w.dane.tresc.length).toBe(1500);
  });
  it("pułapka na boty", () => {
    const w = sprawdzPytanie({ ...DOBRE, www: "http://spam" });
    expect(w.ok && w.bot).toBe(true);
  });
  it("klucz i licznik nowych", () => {
    expect(nowyKlucz().startsWith(PREFIKS_PYTANIA)).toBe(true);
    expect(liczbaNowych([{ status: "nowe" }, { status: "odpowiedziane" }, { status: "nowe" }])).toBe(2);
  });
});

describe("sprzątanie starych pytań", () => {
  it("usuwa tylko załatwione starsze niż 180 dni — nowe i świeże zostają", async () => {
    const { zapiszPytanie } = await import("@/lib/pytania");
    const { sbService } = await import("@/lib/supabase");
    const stare = new Date(Date.now() - 200 * 86400000).toISOString();
    tabela = [
      { klucz: `pytanie:${stare}-a`, wartosc: { status: "odpowiedziane" } },
      { klucz: `pytanie:${stare}-b`, wartosc: { status: "nowe" } },
      { klucz: "mail:2020-01-01-x", wartosc: {} },
    ];
    const los = vi.spyOn(Math, "random").mockReturnValue(0.01);
    await zapiszPytanie(sbService() as never, { produktId: "p", nazwa: "n", zdjecie: null, cena: 1, rozmiar: null, email: "a@b.pl", tresc: "pytanie", czas: new Date().toISOString(), status: "nowe" });
    los.mockRestore();
    expect(tabela.map((w) => w.klucz.slice(-2))).toEqual(["-b", "-x", expect.any(String)].slice(0, 3));
    expect(tabela.some((w) => w.klucz.endsWith("-a"))).toBe(false);
    expect(tabela).toHaveLength(3);
  });
});

describe("API: wysłanie pytania", () => {
  it("zapisuje pytanie i wysyła powiadomienie do sklepu oraz kopię klientowi", async () => {
    const r = await zapytaj(DOBRE);
    expect(r).toEqual({ status: 200, dane: { ok: true } });
    expect(tabela).toHaveLength(1);
    expect(tabela[0].klucz.startsWith("pytanie:")).toBe(true);
    expect(tabela[0].wartosc).toMatchObject({ produktId: "al-m-komplet", nazwa: "Komplet welur", rozmiar: "62", email: "anna@example.com", status: "nowe" });
    expect(maile.map((m) => m.typ).sort()).toEqual(["kopia", "sklep"]);
  });
  it("rozmiar spoza produktu nie jest zapisywany", async () => {
    await zapytaj({ ...DOBRE, rozmiar: "999" });
    expect(tabela[0].wartosc.rozmiar).toBeNull();
  });
  it("nieznany produkt — 404, nic nie zapisane", async () => {
    const r = await zapytaj({ ...DOBRE, produktId: "al-m-nie-ma" });
    expect(r.status).toBe(404);
    expect(tabela).toHaveLength(0);
  });
  it("bot (pułapka) — udany wynik, ale nic nie zapisane i żadnych maili", async () => {
    const r = await zapytaj({ ...DOBRE, www: "x" });
    expect(r.dane.ok).toBe(true);
    expect(tabela).toHaveLength(0);
    expect(maile).toHaveLength(0);
  });
  it("limit: 3 pytania na 10 minut z jednego adresu", async () => {
    const statusy = [];
    for (let i = 0; i < 4; i++) statusy.push((await zapytaj(DOBRE, "10.9.9.9")).status);
    expect(statusy).toEqual([200, 200, 200, 429]);
  });
});

describe("API panelu: odpowiedzi", () => {
  it("bez logowania — 401", async () => {
    admin = false;
    expect((await panel("GET")).status).toBe(401);
    expect((await panel("POST", { id: "pytanie:x", akcja: "zalatwione" })).status).toBe(401);
  });
  it("lista, odpowiedź mailem i status „odpowiedziane”", async () => {
    await zapytaj(DOBRE);
    const lista = (await panel("GET")).dane.items;
    expect(lista).toHaveLength(1);
    const r = await panel("POST", { id: lista[0].id, akcja: "odpowiedz", tekst: "Polecamy 74." });
    expect(r.dane.ok).toBe(true);
    expect(r.dane.pytanie).toMatchObject({ status: "odpowiedziane", odpowiedz: "Polecamy 74." });
    expect(maile.at(-1)).toEqual({ typ: "odpowiedz", do: "anna@example.com", tekst: "Polecamy 74." });
    expect(tabela[0].wartosc.status).toBe("odpowiedziane");
  });
  it("mail nie wyszedł — błąd, pytanie zostaje nowe", async () => {
    await zapytaj(DOBRE);
    mailOk = false;
    const id = (await panel("GET")).dane.items[0].id;
    const r = await panel("POST", { id, akcja: "odpowiedz", tekst: "Polecamy 74." });
    expect(r.status).toBe(502);
    expect(tabela[0].wartosc.status).toBe("nowe");
  });
  it("załatwione, przywrócenie, usunięcie i nieznane pytanie", async () => {
    await zapytaj(DOBRE);
    const id = (await panel("GET")).dane.items[0].id;
    expect((await panel("POST", { id, akcja: "zalatwione" })).dane.pytanie.status).toBe("zalatwione");
    expect((await panel("POST", { id, akcja: "nowe" })).dane.pytanie.status).toBe("nowe");
    expect((await panel("POST", { id, akcja: "usun" })).dane.ok).toBe(true);
    expect(tabela).toHaveLength(0);
    expect((await panel("POST", { id: "pytanie:nie-ma", akcja: "zalatwione" })).status).toBe(404);
    expect((await panel("POST", { id: "mail:cudzy-wpis", akcja: "usun" })).status).toBe(404);
  });
  it("pusta odpowiedź — odmowa", async () => {
    await zapytaj(DOBRE);
    const id = (await panel("GET")).dane.items[0].id;
    expect((await panel("POST", { id, akcja: "odpowiedz", tekst: " " })).status).toBe(400);
  });
});
