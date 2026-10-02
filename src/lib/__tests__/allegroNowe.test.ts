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
  });
});
