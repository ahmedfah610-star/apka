import { beforeEach, describe, expect, it, vi } from "vitest";

// Audyt 21.11.2026: adresy e-mail z formularzy nie mogą działać jak wzorzec (%, _, *) w zapytaniach
// do zamówień, a checkout nie może po cichu pominąć produktu, którego już nie ma w sklepie.
const ilikeArgi: string[] = [];
let zapytaniaZamowien = 0;
vi.mock("@/lib/supabase", () => {
  const zapytanie = () => {
    const q: Record<string, unknown> = {};
    const lancuch = () => q;
    Object.assign(q, {
      select: lancuch,
      in: lancuch,
      eq: lancuch,
      not: lancuch,
      ilike: (_kol: string, wzor: string) => (ilikeArgi.push(wzor), q),
      limit: async () => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
    });
    return q;
  };
  return {
    supabaseWlaczony: () => true,
    sbAnon: () => null,
    sbService: () => ({
      from: (t: string) => {
        if (t === "zamowienia") zapytaniaZamowien++;
        return zapytanie();
      },
    }),
  };
});
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async (ids: string[]) =>
    ids.includes("jest")
      ? [{ id: "jest", nazwa: "Body testowe", cena: 19.99, kategoria: "niemowleta", rozmiary: ["62"], stanRozmiary: { "62": 3 }, stan: 3, kolor: null, zdjecie: null }]
      : [],
}));
vi.mock("@/lib/dostawaDb", () => ({
  pobierzDostawe: async () => ({ metody: [{ id: "paczkomat", nazwa: "Paczkomat InPost", opis: "", cena: 14.6, paczkomat: true }], darmowaOd: 150 }),
}));
vi.mock("@/lib/przelewy24", () => ({ p24Wlaczony: () => true, p24Rejestruj: async () => ({ ok: true, url: "https://p24.test/pay" }) }));
vi.mock("@/lib/platnosci", () => ({ stripe: () => null, stripeWlaczony: () => false, bazowyUrl: () => "https://bobas-shopping.pl" }));

import { EMAIL_BEZPIECZNY, escLike } from "@/lib/escLike";
import { czyKupil } from "@/lib/opinieDb";

beforeEach(() => {
  ilikeArgi.length = 0;
  zapytaniaZamowien = 0;
});

describe("e-maile w zapytaniach do zamówień", () => {
  it("escLike: %, _ i \\ dosłownie", () => {
    expect(escLike("jan_kowalski@x.pl")).toBe("jan\\_kowalski@x.pl");
    expect(escLike("%@%.%")).toBe("\\%@\\%.\\%");
    expect(escLike("a\\b@c.pl")).toBe("a\\\\b@c.pl");
  });

  it("formularze: zwykłe adresy przechodzą, wieloznaczniki nie", () => {
    expect(EMAIL_BEZPIECZNY.test("jan.kowalski+test@gmail.com")).toBe(true);
    expect(EMAIL_BEZPIECZNY.test("anna_nowak@o2.pl")).toBe(true);
    for (const zly of ["%@%.%", "a*@gmail.com", "jan@%.pl", "a\\b@c.pl", "bez-malpy.pl"]) expect(EMAIL_BEZPIECZNY.test(zly)).toBe(false);
  });

  it("opinia z adresem „%@%.%” — odrzucona, zanim sprawdzimy zamówienia", async () => {
    const { POST } = await import("@/app/api/opinie/route");
    const res = await POST(
      new Request("http://localhost/api/opinie", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.7.0.1" },
        body: JSON.stringify({ produktId: "jest", imie: "Ktoś", email: "%@%.%", ocena: 5 }),
      }),
    );
    expect(res.status).toBe(400);
    expect(zapytaniaZamowien).toBe(0);
  });

  it("czyKupil szuka dokładnie tego adresu (podkreślnik nie jest „dowolnym znakiem”)", async () => {
    await czyKupil("anna_nowak@o2.pl", "jest");
    expect(ilikeArgi).toEqual(["anna\\_nowak@o2.pl"]);
  });
});

describe("checkout: produkt, którego już nie ma", () => {
  it("nie pomija go po cichu — prosi o usunięcie z koszyka (409), nic nie zapisuje", async () => {
    const { POST } = await import("@/app/api/platnosc/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/platnosc/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.7.0.2" },
        body: JSON.stringify({
          pozycje: [
            { id: "jest", nazwa: "Body testowe", ilosc: 1, rozmiar: "62" },
            { id: "zniknal", nazwa: "Czapka <b>zimowa</b>", ilosc: 1 },
          ],
          metodaId: "paczkomat",
          klient: { imie: "Anna Test", email: "anna@example.com", telefon: "500600700", paczkomat: "LUB01M" },
        }),
      }),
    );
    expect(res.status).toBe(409);
    const dane = (await res.json()) as { blad: string };
    expect(dane.blad).toBe("Produkt „Czapka bzimowa/b” nie jest już dostępny. Usuń go z koszyka.");
    expect(zapytaniaZamowien).toBe(0);
  });
});
