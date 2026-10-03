import { describe, expect, it, vi } from "vitest";

// Udawana baza (tylko to, czego używa allegroNowe) i udawane Allegro.
type Wiersz = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const baza: Record<string, Wiersz[]> = { produkty: [], allegro_oferty: [] };

function zapytanie(tabela: string) {
  let wiersze = () => baza[tabela];
  const filtry: ((w: Wiersz) => boolean)[] = [];
  const api: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  const wynik = () => wiersze().filter((w) => filtry.every((f) => f(w)));
  api.select = () => api;
  api.like = (k: string, wzor: string) => (filtry.push((w) => String(w[k]).startsWith(wzor.replace("%", ""))), api);
  api.eq = (k: string, v: unknown) => (filtry.push((w) => w[k] === v), api);
  api.order = () => api;
  api.range = async () => ({ data: wynik(), error: null });
  api.maybeSingle = async () => ({ data: wynik()[0] ?? null, error: null });
  api.insert = async (w: Wiersz) => (baza[tabela].push({ ...w }), { error: null });
  api.upsert = async (w: Wiersz, o: { onConflict: string }) => {
    baza[tabela] = baza[tabela].filter((x) => x[o.onConflict] !== w[o.onConflict]).concat({ ...w });
    wiersze = () => baza[tabela];
    return { error: null };
  };
  api.update = (zmiany: Wiersz) => ({
    eq: async (k: string, v: unknown) => {
      baza[tabela] = baza[tabela].map((w) => (w[k] === v ? { ...w, ...zmiany } : w));
      return { error: null };
    },
  });
  return api;
}
vi.mock("@/lib/supabase", () => ({ sbService: () => ({ from: zapytanie }) }));

const oferta = (id: string, nazwa: string, rozmiar: string, sztuk: number, opis: string) => ({
  id,
  name: nazwa,
  sellingMode: { price: { amount: "29.99" } },
  stock: { available: sztuk },
  parameters: [
    { name: "Rozmiar", values: [rozmiar] },
    { name: "Kolor", values: ["niebieski"] },
  ],
  images: [{ url: `https://a.allegroimg.com/${id}.jpg` }],
  description: { sections: [{ items: [{ type: "TEXT", content: `<p>${opis}</p>` }] }] },
});
const OFERTY: Record<string, unknown> = {
  "1001": oferta("1001", "Dres chłopięcy z kapturem 104", "104", 2, "WZROST 104 CM. Dres z kapturem"),
  "1002": oferta("1002", "Dres chłopięcy z kapturem 110", "110", 1, "WZROST 110 CM. Dres z kapturem"),
  "1003": oferta("1003", "Dres chłopięcy z kapturem 116", "116", 3, "WZROST 116 CM. Dres z kapturem"),
};
vi.mock("@/lib/allegroImport", async (orig) => ({
  ...(await orig<typeof import("@/lib/allegroImport")>()),
  szczegoly: async (id: string) => OFERTY[id],
}));
vi.mock("@/lib/allegroStany", () => ({ wszystkieAktywne: async () => [] }));

describe("pobierz nowe z Allegro", () => {
  it("dodaje nowy produkt, dokłada rozmiar z własnym opisem, nie dubluje", async () => {
    const { pobierzPorcje } = await import("@/lib/allegroNowe");

    // 1) Dwa rozmiary nowego produktu w jednej porcji → jeden produkt, dwa rozmiary.
    const w1 = await pobierzPorcje(["1001", "1002"]);
    expect(w1.map((w) => w.wynik)).toEqual(["dodany", "nowy-rozmiar"]);
    expect(baza.produkty).toHaveLength(1);
    const p = baza.produkty[0];
    expect(p.rozmiary).toEqual(["104", "110"]);
    expect(p.stan_rozmiary).toEqual({ "104": 2, "110": 1 });
    expect(p.opis_rozmiary["110"]).toContain("110 CM");
    expect(p.ukryty).toBe(false);
    expect(baza.allegro_oferty).toHaveLength(2);

    // 2) Ponowne przetworzenie — nic nowego, bez duplikatu.
    const w2 = await pobierzPorcje(["1001", "1002"]);
    expect(w2.map((w) => w.wynik)).toEqual(["jest", "jest"]);
    expect(baza.produkty).toHaveLength(1);

    // 3) Nowy rozmiar ISTNIEJĄCEGO produktu: domyślnie produkt nietknięty, tylko raport.
    const przed = JSON.stringify(baza.produkty[0]);
    const w3 = await pobierzPorcje(["1003"]);
    expect(w3[0].wynik).toBe("brak-rozmiaru");
    expect(JSON.stringify(baza.produkty[0])).toBe(przed);

    // 4) Z zaznaczoną opcją — rozmiar dołożony z własną ilością i opisem.
    const w4 = await pobierzPorcje(["1003"], { dokladajRozmiary: true });
    expect(w4[0].wynik).toBe("nowy-rozmiar");
    expect(baza.produkty[0].rozmiary).toEqual(["104", "110", "116"]);
    expect(baza.produkty[0].opis_rozmiary["116"]).toContain("116 CM");
  });

  it("kolejne rozmiary nowości z następnej porcji trafiają do tego samego nowego produktu", async () => {
    baza.produkty = [];
    baza.allegro_oferty = [];
    const { pobierzPorcje } = await import("@/lib/allegroNowe");
    const p1 = await pobierzPorcje(["1001"]);
    expect(p1[0].wynik).toBe("dodany");
    const p2 = await pobierzPorcje(["1002"], { noweProdukty: [p1[0].produkt!] });
    expect(p2[0].wynik).toBe("nowy-rozmiar");
    expect(baza.produkty).toHaveLength(1);
    expect(baza.produkty[0].rozmiary).toEqual(["104", "110"]);
  });

  it("kategoria nowego produktu liczona z pełnej listy rozmiarów", async () => {
    baza.produkty = [];
    baza.allegro_oferty = [];
    OFERTY["2001"] = oferta("2001", "Sweterek dla dziewczynki ciepły 80", "80", 1, "WZROST 80 CM. Sweterek");
    OFERTY["2002"] = oferta("2002", "Sweterek dla dziewczynki ciepły 104", "104", 1, "WZROST 104 CM. Sweterek");
    const { pobierzPorcje } = await import("@/lib/allegroNowe");
    await pobierzPorcje(["2001", "2002"]);
    expect(baza.produkty).toHaveLength(1);
    expect(baza.produkty[0].rozmiary).toEqual(["80", "104"]);
    expect(baza.produkty[0].kategoria).toBe("dziewczynki");
  });
});
