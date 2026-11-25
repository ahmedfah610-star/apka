import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bladZamowienia, cenaPoRabacie, rabatProcentowy, trescZamowienia, PUSTE_DANE, type Zamowienie } from "@/lib/zamowienieWspolne";
import { PUSTA_FAKTURA } from "@/components/FormularzFaktury";
import type { MetodaDostawy } from "@/lib/dostawa";

// „Kup teraz”: zakup jednego produktu z okna przy produkcie. Te same zasady co koszyk (wspólny moduł),
// zapamiętane dane w przeglądarce, faktura i kod ZIMA5 — oraz pełne przejście przez /api/platnosc/checkout.

const POCZTEX: MetodaDostawy = { id: "pocztex-punkt", nazwa: "Pocztex (punkt odbioru)", opis: "", cena: 7.26, punkt: true, operator: "POCZTA", operatorNazwa: "Pocztex" };
const PACZKOMAT: MetodaDostawy = { id: "inpost-paczkomat", nazwa: "InPost Paczkomat 24/7", opis: "", cena: 14.34, paczkomat: true };
const KURIER: MetodaDostawy = { id: "pocztex-kurier", nazwa: "Pocztex Kurier", opis: "", cena: 11.69 };
const DHL: MetodaDostawy = { id: "kurier-dhl", nazwa: "Kurier DPD", opis: "", cena: 23.04, bezDarmowej: true };

const DANE = { imie: "Anna Kwiatek", email: "anna@kwiatek.pl", telefon: "500 600 700", adres: "", miasto: "", kod: "" };
const PUNKT = { kod: "PL-123", opis: "Żabka, ul. Lipowa 1", miasto: "Lublin" };

const zam = (z: Partial<Zamowienie> = {}): Zamowienie => ({
  pozycje: [{ id: "p1", nazwa: "Spodnie", cena: 35, ilosc: 1, rozmiar: "104", kolor: "czarny" }],
  dostawa: 7.26,
  metoda: POCZTEX,
  dane: DANE,
  paczkomat: null,
  punkt: PUNKT,
  faktura: PUSTA_FAKTURA,
  akceptacja: true,
  kod: null,
  ...z,
});

describe("walidacja zamówienia (wspólna dla koszyka i „Kup teraz”)", () => {
  it("poprawne zamówienie z punktem odbioru przechodzi", () => {
    expect(bladZamowienia(zam())).toBeNull();
  });
  it("brak imienia lub e-maila", () => {
    expect(bladZamowienia(zam({ dane: { ...DANE, imie: "  " } }))).toBe("Uzupełnij imię i e-mail.");
    expect(bladZamowienia(zam({ dane: { ...DANE, email: "" } }))).toBe("Uzupełnij imię i e-mail.");
  });
  it("punkt i paczkomat muszą być wybrane na mapie", () => {
    expect(bladZamowienia(zam({ punkt: null }))).toBe("Wybierz punkt Pocztex na mapie.");
    expect(bladZamowienia(zam({ metoda: PACZKOMAT, punkt: null }))).toBe("Wybierz paczkomat InPost.");
    expect(bladZamowienia(zam({ metoda: PACZKOMAT, punkt: null, paczkomat: { kod: "LUB01M", opis: "Lublin" } }))).toBeNull();
  });
  it("kurier wymaga pełnego adresu", () => {
    expect(bladZamowienia(zam({ metoda: KURIER, punkt: null }))).toBe("Uzupełnij adres dostawy.");
    expect(bladZamowienia(zam({ metoda: KURIER, punkt: null, dane: { ...DANE, adres: "Lipowa 1", miasto: "Lublin", kod: "20-001" } }))).toBeNull();
  });
  it("faktura: zaznaczona = dane sprawdzone (zły NIP zatrzymuje zamówienie)", () => {
    const zlaFirma = { ...PUSTA_FAKTURA, chce: true, typ: "firma" as const, nip: "123", nazwa: "Firma", adres: "Lipowa 1", kod: "20-001", miasto: "Lublin" };
    expect(bladZamowienia(zam({ faktura: zlaFirma }))).toMatch(/NIP/);
    expect(bladZamowienia(zam({ faktura: { ...zlaFirma, nip: "526 025 02 74" } }))).toBeNull();
    // Odznaczona faktura — jej pola nie mają znaczenia.
    expect(bladZamowienia(zam({ faktura: { ...zlaFirma, chce: false } }))).toBeNull();
  });
  it("bez akceptacji regulaminu nie ma zamówienia", () => {
    expect(bladZamowienia(zam({ akceptacja: false }))).toBe("Zaakceptuj Regulamin i Politykę prywatności.");
  });
  it("kod ZIMA5 (raz na numer) wymaga telefonu — komunikat nie zdradza zasady", () => {
    expect(bladZamowienia(zam({ kod: "ZIMA5", dane: { ...DANE, telefon: "" } }))).toBe("Podaj numer telefonu (9 cyfr) — przewoźnik wyśle Ci SMS o paczce.");
    expect(bladZamowienia(zam({ kod: "ZIMA5" }))).toBeNull();
    expect(bladZamowienia(zam({ dane: { ...DANE, telefon: "" } }))).toBeNull(); // bez kodu telefon nieobowiązkowy
  });
});

describe("treść zamówienia do serwera", () => {
  it("punkt odbioru: kod punktu, opis i miasto, bez adresu; źródło „kup-teraz”", () => {
    const t = trescZamowienia(zam({ zrodlo: "kup-teraz", kod: "ZIMA5" }));
    expect(t).toMatchObject({ metodaId: "pocztex-punkt", metoda: "Pocztex (punkt odbioru) · Przelewy24", kod: "ZIMA5", faktura: null, zrodlo: "kup-teraz" });
    expect(t.klient).toEqual({ imie: "Anna Kwiatek", email: "anna@kwiatek.pl", telefon: "500 600 700", uwagi: undefined, punkt: "PL-123", punktOpis: "Żabka, ul. Lipowa 1", miasto: "Lublin" });
  });
  it("kurier: adres; koszyk bez źródła", () => {
    const t = trescZamowienia(zam({ metoda: KURIER, punkt: null, dane: { ...DANE, adres: " Lipowa 1 ", miasto: "Lublin", kod: "20-001" } }));
    expect(t.klient).toMatchObject({ adres: "Lipowa 1", miasto: "Lublin", kod: "20-001" });
    expect("zrodlo" in t).toBe(false);
  });
  it("faktura na firmę idzie jako dane faktury", () => {
    const t = trescZamowienia(zam({ faktura: { ...PUSTA_FAKTURA, chce: true, nip: "526-025-02-74", nazwa: "Kwiatek", adres: "Lipowa 1", kod: "20-001", miasto: "Lublin" } }));
    expect(t.faktura).toMatchObject({ typ: "firma", nip: "5260250274", nazwa: "Kwiatek" });
  });
});

describe("cena z kodem (jak na serwerze)", () => {
  it("−5%: zaokrąglenie do grosza identyczne jak w lib/kodyDb", () => {
    expect(rabatProcentowy(35, 5)).toBe(1.75);
    expect(cenaPoRabacie(35, 5)).toBe(33.25);
    expect(cenaPoRabacie(19.99, 5)).toBe(18.99); // 0,9995 → 1,00
    expect(cenaPoRabacie(6.99, 5)).toBe(6.64); // 0,3495 → 0,35
    expect(cenaPoRabacie(49.99, 5)).toBe(47.49);
  });
});

describe("metody w „Kup teraz” od najtańszej", () => {
  it("sortuje po koszcie, pomija ukryte; po progu darmowa (oprócz kurierów zawsze płatnych)", async () => {
    vi.doMock("@/lib/zdjecia", () => ({ zdjecie: (u: string) => u }));
    const { metodyOdNajtanszej } = await import("@/components/KupTeraz");
    const metody = [PACZKOMAT, DHL, { ...KURIER, aktywna: false }, POCZTEX];
    expect(metodyOdNajtanszej(metody, 35, 150).map((m) => m.id)).toEqual(["pocztex-punkt", "inpost-paczkomat", "kurier-dhl"]);
    // Powyżej progu: paczkomat i Pocztex po 0 zł (kolejność z ustawień), DHL płatny na końcu.
    expect(metodyOdNajtanszej(metody, 160, 150).map((m) => m.id)).toEqual(["inpost-paczkomat", "pocztex-punkt", "kurier-dhl"]);
  });
});

describe("zapamiętane dane klienta (tylko w przeglądarce)", () => {
  const pamiec = new Map<string, string>();
  beforeEach(() => {
    pamiec.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => pamiec.get(k) ?? null,
      setItem: (k: string, v: string) => void pamiec.set(k, String(v)),
      removeItem: (k: string) => void pamiec.delete(k),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("zapis po zamówieniu → odczyt: dane, metoda, punkt tej metody", async () => {
    const z = await import("@/lib/zapamietaneDane");
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: PUSTA_FAKTURA });
    const w = z.wczytajDane()!;
    expect(w.dane).toEqual(DANE);
    expect(w.metodaId).toBe("pocztex-punkt");
    expect(w.punkty).toEqual({ "pocztex-punkt": PUNKT });
    expect(w.faktura).toBeUndefined();
  });

  it("kolejne zamówienie inną metodą nie gubi punktu poprzedniej", async () => {
    const z = await import("@/lib/zapamietaneDane");
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: PUSTA_FAKTURA });
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "inpost-paczkomat", paczkomat: { kod: "LUB01M", opis: "Lublin" }, punkt: null, faktura: PUSTA_FAKTURA });
    const w = z.wczytajDane()!;
    expect(w.metodaId).toBe("inpost-paczkomat");
    expect(w.paczkomat?.kod).toBe("LUB01M");
    expect(w.punkty?.["pocztex-punkt"]?.kod).toBe("PL-123");
  });

  it("odznaczone „Zapamiętaj” kasuje zapis", async () => {
    const z = await import("@/lib/zapamietaneDane");
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: PUSTA_FAKTURA });
    z.zapamietajPoZamowieniu(false, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: PUSTA_FAKTURA });
    expect(z.wczytajDane()).toBeNull();
  });

  it("faktura: dane zapamiętane, ale „Chcę fakturę” przy następnym zakupie odznaczone", async () => {
    const z = await import("@/lib/zapamietaneDane");
    const fv = { ...PUSTA_FAKTURA, chce: true, nip: "5260250274", nazwa: "Kwiatek", adres: "Lipowa 1", kod: "20-001", miasto: "Lublin", uwagi: "jednorazowa uwaga" };
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: fv });
    const f = z.fakturaZZapisu(PUSTA_FAKTURA, z.wczytajDane()!.faktura);
    expect(f).toMatchObject({ chce: false, typ: "firma", nip: "5260250274", nazwa: "Kwiatek", uwagi: "" });
    // Faktura nie zaznaczona przy kolejnym zakupie — dane faktury z poprzedniego zostają.
    z.zapamietajPoZamowieniu(true, { dane: DANE, metodaId: "pocztex-punkt", paczkomat: null, punkt: PUNKT, faktura: PUSTA_FAKTURA });
    expect(z.wczytajDane()!.faktura?.nazwa).toBe("Kwiatek");
  });

  it("uzupełnia tylko puste pola; śmieci i stare zapisy są ignorowane", async () => {
    const z = await import("@/lib/zapamietaneDane");
    expect(z.uzupelnijPuste({ ...PUSTE_DANE, imie: "Ola" }, DANE)).toEqual({ ...DANE, imie: "Ola" });
    pamiec.set("bobas-dane-klienta", "{nie json");
    expect(z.wczytajDane()).toBeNull();
    pamiec.set("bobas-dane-klienta", JSON.stringify({ dane: DANE, czas: Date.now() - 400 * 86400000 }));
    expect(z.wczytajDane()).toBeNull();
    pamiec.set("bobas-dane-klienta", JSON.stringify({ dane: { ...DANE, imie: 5 }, punkty: { x: { kod: 1 } }, czas: Date.now() }));
    expect(z.wczytajDane()).toMatchObject({ dane: { imie: "" }, punkty: {} });
  });
});

// ── Pełne przejście: okno „Kup teraz” → /api/platnosc/checkout → zamówienie w bazie + Przelewy24 ──
const zapisane: Record<string, unknown>[] = [];
const p24: { amount: number }[] = [];
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [{ id: "p1", nazwa: "Spodnie", cena: 35, kategoria: "chlopcy", rozmiary: ["104"], stanRozmiary: { "104": 1 }, stan: 1, kolor: "czarny", zdjecie: null }],
}));
vi.mock("@/lib/dostawaDb", () => ({ pobierzDostawe: async () => ({ metody: [POCZTEX, PACZKOMAT], darmowaOd: 150 }) }));
vi.mock("@/lib/przelewy24", () => ({
  p24Wlaczony: () => true,
  p24Rejestruj: async (p: { amount: number }) => (p24.push(p), { ok: true, url: "https://p24.test/pay" }),
}));
vi.mock("@/lib/platnosci", () => ({ stripe: () => null, stripeWlaczony: () => false, bazowyUrl: () => "https://bobas-shopping.pl" }));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: (t: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), not: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
      insert: (w: Record<string, unknown>) => {
        if (t === "zamowienia") zapisane.push(w);
        return { select: () => ({ single: async () => ({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: null }) }) };
      },
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  }),
}));

describe("„Kup teraz” → serwer", () => {
  let nr = 0;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-01T12:00:00+01:00"));
    zapisane.length = 0;
    p24.length = 0;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  async function wyslij(tresc: unknown) {
    const { POST } = await import("@/app/api/platnosc/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/platnosc/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": `10.9.0.${++nr}` },
        body: JSON.stringify(tresc),
      }),
    );
    return { status: res.status, d: (await res.json()) as { ok?: boolean; url?: string; blad?: string } };
  }

  it("ZIMA5 + faktura na firmę + punkt Pocztex: kwota 33,25 + 7,26 = 40,51 zł, źródło zapisane", async () => {
    const fv = { ...PUSTA_FAKTURA, chce: true, nip: "526 025 02 74", nazwa: "Kwiatek i Syn", adres: "Lipowa 12", kod: "20001", miasto: "Lublin" };
    const r = await wyslij(trescZamowienia(zam({ kod: "ZIMA5", faktura: fv, zrodlo: "kup-teraz" })));
    expect(r.d).toMatchObject({ ok: true, url: "https://p24.test/pay" });
    expect(p24[0].amount).toBe(4051);
    const z = zapisane[0] as { razem: number; rabat: number; kod_rabatowy: string; klient: Record<string, unknown> };
    expect(z).toMatchObject({ razem: 40.51, rabat: 1.75, kod_rabatowy: "ZIMA5" });
    expect(z.klient).toMatchObject({ zrodlo: "kup-teraz", punkt: "PL-123", telefon: "500 600 700", faktura: { nip: "5260250274", nazwa: "Kwiatek i Syn" } });
  });

  it("nieznane źródło nie trafia do zamówienia", async () => {
    const r = await wyslij({ ...trescZamowienia(zam()), zrodlo: "<script>" });
    expect(r.d.ok).toBe(true);
    expect((zapisane[0].klient as Record<string, unknown>).zrodlo).toBeUndefined();
    expect(p24[0].amount).toBe(4226); // 35 + 7,26 — bez kodu
  });
});
