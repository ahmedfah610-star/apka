import { beforeEach, describe, expect, it, vi } from "vitest";

// Panel → zamówienie → „Brak towaru”: walidacja, kwota, próba na skrzynkę firmy, wpis w zamówieniu.
let admin = true;
let zamowienie: Record<string, unknown> | null = null;
const zapisy: Record<string, unknown>[] = [];
const maile: { d: Record<string, unknown>; proba: boolean }[] = [];
let mailOk = true;

vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => admin }));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: zamowienie }) }) }),
      update: (w: Record<string, unknown>) => ({ eq: async () => (zapisy.push(w), { error: null }) }),
    }),
  }),
}));
vi.mock("@/lib/mail", () => ({
  wyslijMailWyslano: vi.fn(),
  wyslijPrzypomnieniePlatnosci: vi.fn(),
  wyslijMailBrakTowaru: async (d: Record<string, unknown>, o: { proba?: boolean } = {}) => {
    maile.push({ d, proba: !!o.proba });
    return mailOk ? { ok: true, do: o.proba ? "sklep@firma.pl" : d.email } : { ok: false, blad: "Resend: błąd" };
  },
}));

const ZAM = () => ({
  id: "a1b2c3d4-0000-4000-8000-000000000000",
  status: "oplacone",
  suma: 50,
  rabat: 5,
  razem: 52.26,
  pozycje: [
    { nazwa: "Czapka", cena: 10, ilosc: 2, rozmiar: "62" },
    { nazwa: "Body", cena: 30, ilosc: 1, rozmiar: "68", kolor: "różowy" },
  ],
  klient: { email: "anna@example.com", imie: "Anna Kowalska", braki: [{ czas: "2026-11-01T10:00:00Z", pozycje: ["Stare"], kwota: 1, zwrot: "konto" }] },
});

async function wyslij(b: Record<string, unknown>) {
  const { POST } = await import("@/app/api/zamowienia/route");
  const r = await POST(new Request("http://localhost/api/zamowienia", { method: "POST", body: JSON.stringify({ akcja: "brak-towaru", id: ZAM().id, ...b }) }));
  return { status: r.status, d: (await r.json()) as Record<string, unknown> };
}

beforeEach(() => {
  admin = true;
  zamowienie = ZAM();
  zapisy.length = 0;
  maile.length = 0;
  mailOk = true;
});

describe("brak towaru — akcja w panelu", () => {
  it("bez logowania do panelu — 401, nic nie wysłane", async () => {
    admin = false;
    expect((await wyslij({ pozycje: [1] })).status).toBe(401);
    expect(maile).toHaveLength(0);
  });

  it("część zamówienia: kwota z rabatem, mail do klienta, wpis dopisany do historii", async () => {
    const { status, d } = await wyslij({ pozycje: [1], zwrot: "zwrocone" });
    expect(status).toBe(200);
    expect(maile).toHaveLength(1);
    expect(maile[0].proba).toBe(false);
    expect(maile[0].d).toMatchObject({ email: "anna@example.com", imie: "Anna Kowalska", calosc: false, kwota: 27, zwrot: "zwrocone", kod: "NADROBIMY10", procentKodu: 10 });
    const braki = (zapisy[0].klient as { braki: { pozycje: string[]; kwota: number }[] }).braki;
    expect(braki).toHaveLength(2); // stary wpis zostaje
    expect(braki[1]).toMatchObject({ pozycje: ["Body, rozm. 68, różowy"], kwota: 27, zwrot: "zwrocone" });
    expect((zapisy[0].klient as { email: string }).email).toBe("anna@example.com"); // reszta danych klienta nietknięta
    expect(d.ok).toBe(true);
  });

  it("całe zamówienie → cała kwota z dostawą; ręczna kwota nie może przekroczyć zapłaconej", async () => {
    await wyslij({ pozycje: [0, 1], zwrot: "konto" });
    expect(maile[0].d).toMatchObject({ calosc: true, kwota: 52.26, zwrot: "konto" });
    await wyslij({ pozycje: [0], kwota: 999 });
    expect(maile[1].d.kwota).toBe(52.26);
    await wyslij({ pozycje: [0], kwota: 15.5 });
    expect(maile[2].d.kwota).toBe(15.5);
  });

  it("próba: mail na skrzynkę firmy, NIC nie zapisane w zamówieniu", async () => {
    const { status, d } = await wyslij({ pozycje: [1], proba: true });
    expect(status).toBe(200);
    expect(d).toMatchObject({ ok: true, proba: true, do: "sklep@firma.pl", kwota: 27 });
    expect(maile[0].proba).toBe(true);
    expect(zapisy).toHaveLength(0);
  });

  it("błędy: brak zaznaczonych produktów, brak e-maila, nieznane zamówienie, mail nie wyszedł (bez wpisu)", async () => {
    expect((await wyslij({ pozycje: [] })).status).toBe(400);
    expect((await wyslij({ pozycje: [9] })).status).toBe(400);
    zamowienie = { ...ZAM(), klient: { imie: "Bez maila" } };
    expect((await wyslij({ pozycje: [0] })).status).toBe(400);
    zamowienie = null;
    expect((await wyslij({ pozycje: [0] })).status).toBe(404);
    zamowienie = ZAM();
    mailOk = false;
    const r = await wyslij({ pozycje: [0] });
    expect(r.status).toBe(502);
    expect(zapisy).toHaveLength(0);
    expect(maile.filter((m) => !m.proba)).toHaveLength(1); // tylko ta nieudana próba wysyłki
  });
});
