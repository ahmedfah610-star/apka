import { describe, expect, it } from "vitest";
import { slugProduktu, urlProduktu, idZAdresu, slugTekstu, ID_PRODUKTU, WZOR_ID_PRODUKTU } from "@/lib/adresProduktu";
import { KOLEKCJE, produktyKolekcji } from "@/data/kolekcje";

// Czytelne adresy produktów: nazwa + kolor + id na końcu; id zawsze da się odczytać z adresu.
describe("adres produktu", () => {
  it("nazwa i kolor bez polskich znaków, id na końcu", () => {
    expect(urlProduktu({ id: "al-m-9mibdz", nazwa: "Pajacyk bawełna zapinany na zatrzaski wyprawka", kolor: "fioletowy" })).toBe(
      "/produkty/pajacyk-bawelna-zapinany-na-zatrzaski-wyprawka-fioletowy-al-m-9mibdz",
    );
    expect(slugTekstu("Żółć  & Łódź — 100% bawełna!")).toBe("zolc-lodz-100-bawelna");
  });

  it("kolor nie powtarza się i nic nie mówiące kolory są pomijane", () => {
    expect(slugProduktu({ id: "al-m-abc1", nazwa: "Sweter męski czarny półgolf", kolor: "czarny" })).toBe("sweter-meski-czarny-polgolf-al-m-abc1");
    expect(slugProduktu({ id: "al-m-abc1", nazwa: "Legginsy getry", kolor: "wielokolorowy" })).toBe("legginsy-getry-al-m-abc1");
    expect(slugProduktu({ id: "reczny-mux3vv8o", nazwa: "Czapka", kolor: null })).toBe("czapka-reczny-mux3vv8o");
  });

  it("długie nazwy są ucinane na granicy słowa", () => {
    const s = slugProduktu({ id: "al-m-x1", nazwa: "Komplet niemowlęcy dla dziewczynki ocieplany polar ciepły bardzo długi tytuł oferty z Allegro welur", kolor: "różowy" });
    expect(s.endsWith("-al-m-x1")).toBe(true);
    expect(s.length).toBeLessThanOrEqual(70 + "-al-m-x1".length);
    expect(s).not.toMatch(/--/);
  });

  it("id odczytane z nowego i ze starego adresu — także gdy nazwa zawiera podobne fragmenty", () => {
    expect(idZAdresu("pajacyk-bawelna-fioletowy-al-m-9mibdz")).toBe("al-m-9mibdz");
    expect(idZAdresu("al-m-9mibdz")).toBe("al-m-9mibdz");
    expect(idZAdresu("sweter-royal-al-m-czarny-al-m-xyz9")).toBe("al-m-xyz9");
    expect(idZAdresu("czapka-reczny-mux3vv8o")).toBe("reczny-mux3vv8o");
    expect(idZAdresu("metal-al-12ab")).toBe("al-12ab");
    expect(idZAdresu("cos-innego")).toBeNull();
  });

  it("nieznany format id — zostaje stary adres (nic się nie psuje)", () => {
    expect(urlProduktu({ id: "nowy_format_1", nazwa: "Body", kolor: "białe" })).toBe("/produkty/nowy_format_1");
  });

  it("wzór z next.config (przepisanie adresu) wyciąga to samo id", () => {
    // Ten sam wzór co w rewrites(): /produkty/:slug([a-z0-9-]+)-:id(WZOR)
    const re = new RegExp(`^/produkty/([a-z0-9-]+)-(${WZOR_ID_PRODUKTU})$`);
    for (const p of [
      { id: "al-m-9mibdz", nazwa: "Pajacyk bawełna", kolor: "fioletowy" },
      { id: "al-m-xyz9", nazwa: "Sweter Royal al m czarny", kolor: null },
      { id: "reczny-mux3vv8o", nazwa: "Czapka metal", kolor: "szary" },
    ]) {
      const m = re.exec(urlProduktu(p));
      expect(m?.[2]).toBe(p.id);
      expect(ID_PRODUKTU.test(p.id)).toBe(true);
    }
    expect(re.test("/produkty/al-m-9mibdz")).toBe(false); // sam kod obsługuje strona + przekierowanie
  });
});

describe("kolekcje męskie", () => {
  const prod = (id: string, nazwa: string, kategoria: string, rozmiary: string[] = ["L"]) => ({ id, nazwa, kategoria, rozmiary, cena: 50 }) as never;
  const katalog = [
    prod("s1", "Sweter męski rozpinany półgolf", "dorosli", ["L", "XL"]),
    prod("b1", "Bluza męska z kapturem kangur", "dorosli", ["M", "2XL/3XL"]),
    prod("d1", "Spodnie Dresowe męskie ocieplane", "dorosli", ["XL", "6XL"]),
    prod("k1", "Dres chłopięcy komplet", "chlopcy", ["122"]),
    prod("k2", "Sweterek dla dziewczynki", "dziewczynki", ["92"]),
  ];
  const kol = (slug: string) => produktyKolekcji(katalog, KOLEKCJE.find((k) => k.slug === slug)!).map((p) => p.id);

  it("swetry, bluzy, spodnie dresowe i duże rozmiary", () => {
    expect(kol("swetry-meskie")).toEqual(["s1"]);
    expect(kol("bluzy-meskie")).toEqual(["b1"]);
    expect(kol("spodnie-dresowe-meskie")).toEqual(["d1"]);
    expect(kol("odziez-meska-duze-rozmiary")).toEqual(["b1", "d1"]);
  });

  it("kolekcje dziecięce nie pokazują odzieży męskiej", () => {
    expect(kol("dresy-dzieciece")).toEqual(["k1"]);
  });
});
