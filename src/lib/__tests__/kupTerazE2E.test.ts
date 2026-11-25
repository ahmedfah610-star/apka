import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { trescZamowienia, type Zamowienie } from "@/lib/zamowienieWspolne";
import { PUSTA_FAKTURA } from "@/components/FormularzFaktury";

// Cała ścieżka zamówienia z „Kup teraz” na sztucznej bazie (bez prawdziwej bazy i płatności):
// okno → /api/platnosc/checkout (zapis) → powiadomienie Przelewy24 (opłacone) → maile → lista w panelu.

type Wiersz = Record<string, unknown>;
const baza: Record<string, Wiersz[]> = { zamowienia: [] };
const maile: { to: string | string[]; subject: string; html: string }[] = [];
const rpc: string[] = [];

// Minimalny „Supabase”: select/eq/not/order/limit/insert/update/single/maybeSingle na tablicach w pamięci.
function zapytanie(tabela: string) {
  const filtry: ((w: Wiersz) => boolean)[] = [];
  let doZapisu: Wiersz | null = null;
  let zmiana: Wiersz | null = null;
  const wiersze = () => (baza[tabela] ?? []).filter((w) => filtry.every((f) => f(w)));
  const q = {
    select: () => q,
    eq: (k: string, v: unknown) => (filtry.push((w) => w[k] === v), q),
    not: (k: string, _op: string, lista: string) => (filtry.push((w) => !lista.includes(`"${String(w[k])}"`)), q),
    order: () => q,
    limit: () => q,
    insert: (w: Wiersz) => {
      doZapisu = { id: "a1b2c3d4-1111-4111-8111-111111111111", created_at: new Date().toISOString(), ...w };
      (baza[tabela] ??= []).push(doZapisu);
      return q;
    },
    update: (z: Wiersz) => ((zmiana = z), q),
    single: async () => ({ data: doZapisu ?? wiersze()[0] ?? null, error: null }),
    maybeSingle: async () => ({ data: wiersze()[0] ?? null, error: null }),
    then: (ok: (r: { data: Wiersz[]; error: null }) => unknown) => {
      if (zmiana) for (const w of wiersze()) Object.assign(w, zmiana);
      return Promise.resolve({ data: wiersze(), error: null }).then(ok);
    },
  };
  return q;
}

vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: zapytanie,
    rpc: async (nazwa: string, a: { p_id?: string }) => {
      rpc.push(nazwa);
      if (nazwa === "oplac_zamowienie") for (const w of baza.zamowienia) if (w.id === a.p_id) w.status = "oplacone";
      return { error: null };
    },
  }),
}));
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [
    {
      id: "al-m-bdtu9z",
      nazwa: "Spodnie Dresowe Chłopięce dla chłopca Wygodne sportowe kieszenie",
      cena: 35,
      kategoria: "chlopcy",
      rozmiary: ["104"],
      stanRozmiary: { "104": 1 },
      stan: 1,
      kolor: "wielokolorowy",
      zdjecie: "https://a.allegroimg.com/original/11f55b/53886e884920b4ff022fc9e181cb",
    },
  ],
}));
const POCZTEX = { id: "pocztex-punkt", nazwa: "Pocztex (punkt odbioru)", opis: "Odbiór punkcie Pocztex", cena: 7.26, punkt: true, operator: "POCZTA", operatorNazwa: "Pocztex" };
vi.mock("@/lib/dostawaDb", () => ({ pobierzDostawe: async () => ({ metody: [POCZTEX], darmowaOd: 150 }) }));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { sessionId: string }) => ({ ok: true, url: `https://secure.przelewy24.pl/trnRequest/${p.sessionId}` }),
  p24PodpisNotyfikacjiOk: () => true,
  p24Weryfikuj: async () => true,
}));
vi.mock("@/lib/platnosci", () => ({ stripe: () => null, stripeWlaczony: () => false, bazowyUrl: () => "https://bobas-shopping.pl" }));
vi.mock("@/lib/rewalidacja", () => ({ idZPozycji: () => [], odswiezPoZmianieStanu: () => {} }));
vi.mock("@/lib/ga4Serwer", () => ({ oczyscPomiar: () => undefined, zglosZakupGA4Serwer: async () => true }));
vi.mock("@/lib/mailLog", () => ({ zapiszMail: async () => {} }));
vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => true }));

const OUT = process.env.OUT;

beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-25T15:00:00+01:00"));
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_SKLEP = "";
  vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
    if (String(url).includes("resend.com")) {
      const b = JSON.parse(init.body);
      maile.push({ to: b.to, subject: b.subject, html: b.html });
      return new Response(JSON.stringify({ id: "re_" + maile.length }), { status: 200 });
    }
    throw new Error("nieoczekiwane zapytanie: " + url);
  });
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("„Kup teraz” — od kliknięcia do panelu i maili", () => {
  let id = "";

  it("1) okno wysyła zamówienie → zapis w bazie (czeka na płatność) i przekierowanie do Przelewy24", async () => {
    const z: Zamowienie = {
      pozycje: [{ id: "al-m-bdtu9z", nazwa: "Spodnie", cena: 35, ilosc: 1, rozmiar: "104", kolor: "wielokolorowy" }],
      dostawa: 7.26,
      metoda: POCZTEX,
      dane: { imie: "Anna Kwiatek", email: "anna@example.com", telefon: "500 600 700", adres: "", miasto: "", kod: "" },
      paczkomat: null,
      punkt: { kod: "PL-20001-123", opis: "Żabka, ul. Lipowa 1", miasto: "Lublin" },
      faktura: { ...PUSTA_FAKTURA, chce: true, nip: "526 025 02 74", nazwa: "Kwiatek i Syn Sp. z o.o.", adres: "ul. Lipowa 12/4", kod: "20001", miasto: "Lublin" },
      akceptacja: true,
      kod: "ZIMA5",
      zrodlo: "kup-teraz",
    };
    const { POST } = await import("@/app/api/platnosc/checkout/route");
    const res = await POST(
      new Request("https://bobas-shopping.pl/api/platnosc/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.20.0.1" },
        body: JSON.stringify(trescZamowienia(z)),
      }),
    );
    const d = (await res.json()) as { ok: boolean; url: string };
    expect(d.ok).toBe(true);
    expect(d.url).toMatch(/przelewy24/);
    const w = baza.zamowienia[0];
    id = String(w.id);
    expect(w).toMatchObject({ status: "oczekuje_na_platnosc", suma: 35, dostawa: 7.26, rabat: 1.75, razem: 40.51, kod_rabatowy: "ZIMA5", metoda: "Pocztex (punkt odbioru) · Przelewy24" });
    expect(w.pozycje).toEqual([expect.objectContaining({ id: "al-m-bdtu9z", cena: 35, ilosc: 1, rozmiar: "104", kolor: "wielokolorowy" })]);
    expect(w.klient).toMatchObject({
      imie: "Anna Kwiatek",
      email: "anna@example.com",
      telefon: "500 600 700",
      punkt: "PL-20001-123",
      punktOpis: "Żabka, ul. Lipowa 1",
      miasto: "Lublin",
      zrodlo: "kup-teraz",
      faktura: { typ: "firma", nip: "5260250274", nazwa: "Kwiatek i Syn Sp. z o.o.", kod: "20-001" },
    });
    expect(maile).toHaveLength(0); // przed zapłatą — żadnych maili
  });

  it("2) Przelewy24 potwierdza wpłatę → opłacone, stan zdjęty, kod policzony, maile do klienta i sklepu", async () => {
    const { POST } = await import("@/app/api/platnosc/p24/webhook/route");
    const res = await POST(
      new Request("https://bobas-shopping.pl/api/platnosc/p24/webhook", {
        method: "POST",
        body: JSON.stringify({ merchantId: 1, posId: 1, sessionId: id, amount: 4051, originAmount: 4051, currency: "PLN", orderId: 777, methodId: 181, statement: "x", sign: "x" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(baza.zamowienia[0].status).toBe("oplacone");
    expect(rpc).toEqual(["oplac_zamowienie", "uzyj_kodu"]);
    expect(maile).toHaveLength(2);

    const doKlienta = maile.find((m) => m.to === "anna@example.com")!;
    expect(doKlienta.subject).toBe(`Potwierdzenie zamówienia ${id.slice(0, 8)} — bobas-shopping`);
    for (const t of ["Spodnie Dresowe Chłopięce", "104", "40,51 zł", "ZIMA5", "Pocztex", "PL-20001-123", "Kwiatek i Syn", "526-025-02-74"]) expect(doKlienta.html).toContain(t);

    const doSklepu = maile.find((m) => m.to === "amin.kids1@hotmail.com")!;
    expect(doSklepu.subject).toBe(`Nowe zamówienie ${id.slice(0, 8)} — 40,51 zł · FAKTURA`);
    for (const t of ["Klient chce fakturę", "Kup teraz", "500 600 700", "anna@example.com", "PL-20001-123", "5260250274".slice(0, 3)]) expect(doSklepu.html).toContain(t);

    if (OUT) {
      writeFileSync(`${OUT}/mail-klient.html`, doKlienta.html);
      writeFileSync(`${OUT}/mail-sklep.html`, doSklepu.html);
    }
  });

  it("3) powtórzone powiadomienie P24 nie dubluje maili ani zdjęcia stanu", async () => {
    const { POST } = await import("@/app/api/platnosc/p24/webhook/route");
    await POST(new Request("https://x/api", { method: "POST", body: JSON.stringify({ sessionId: id, amount: 4051, currency: "PLN", orderId: 777 }) }));
    expect(maile).toHaveLength(2);
    expect(rpc).toEqual(["oplac_zamowienie", "uzyj_kodu"]);
  });

  it("4) panel zamówień dostaje komplet danych (status, kwoty, kod, faktura, źródło)", async () => {
    const { GET } = await import("@/app/api/zamowienia/route");
    const d = (await (await GET()).json()) as { items: Record<string, unknown>[] };
    expect(d.items).toHaveLength(1);
    expect(d.items[0]).toMatchObject({ id, status: "oplacone", suma: 35, dostawa: 7.26, razem: 40.51, rabat: 1.75, kodRabatowy: "ZIMA5" });
    expect(d.items[0].klient).toMatchObject({ zrodlo: "kup-teraz", faktura: { nip: "5260250274" } });
    if (OUT) writeFileSync(`${OUT}/panel-zamowienia.json`, JSON.stringify(d));
  });
});
