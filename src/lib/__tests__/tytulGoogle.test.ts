import { describe, expect, it } from "vitest";
import { kolorDoTytulu, tytulGoogle, uporzadkujNazwe } from "@/lib/feedEtykiety";
import { KOLORY_ZWERYFIKOWANE, TYTUL_BEZ_ZMIAN } from "@/data/koloryZweryfikowane";
import type { Produkt } from "@/data/produkty";

// Tytuły w pliku produktowym (bezpłatne wyniki Zakupów Google): tylko pewne dopiski, kolor wyłącznie
// potwierdzony na zdjęciu, nazwy w sklepie bez zmian, bez haseł zakazanych przez Google.
type P = Pick<Produkt, "id" | "nazwa" | "opis" | "kategoria" | "kolor" | "rozmiary">;
const P = (o: Partial<P> & { nazwa: string }): P => ({ id: "t1", opis: "", kategoria: "niemowleta", kolor: null, rozmiary: ["62", "68"], ...o });
const OK = (p: P) => ({ [p.id]: String(p.kolor) });

describe("tytuł dla Google", () => {
  it("body z napisem: dla kogo zaraz po rodzaju ubranka, potwierdzony kolor, rozmiar pozycji", () => {
    const p = P({ nazwa: "Body długi rękaw babcia tu była", kolor: "czerwony" });
    expect(tytulGoogle(p, "74", OK(p), new Set())).toBe("Body dla niemowlaka długi rękaw babcia tu była – kolor czerwony, rozm. 74");
  });

  it("kolor tylko potwierdzony na zdjęciu — niesprawdzony albo zmieniony od sprawdzenia nie trafia do tytułu", () => {
    const p = P({ nazwa: "Pajacyk bawełna zapinany na zatrzaski", kolor: "czerwony (bordowy)" });
    expect(tytulGoogle(p, "62", {}, new Set())).toBe("Pajacyk bawełna zapinany na zatrzaski dla niemowlaka – rozm. 62");
    expect(tytulGoogle(p, "62", { t1: "biały" }, new Set())).not.toMatch(/kolor/);
    expect(tytulGoogle(p, "62", OK(p), new Set())).toMatch(/– kolor bordowy, rozm\. 62$/);
  });

  it("sweterkowa kamizelka: dla kogo + „na zimę”; rozmiary ponad 86 w niemowlętach → „dla dziecka”", () => {
    const p = P({ nazwa: "Kamizelka bezrękawnik sweterkowa dzianina auto", kolor: "szary (grafitowy)", rozmiary: ["80", "92", "110"] });
    expect(tytulGoogle(p, "80", OK(p), new Set())).toBe("Kamizelka bezrękawnik sweterkowa dzianina auto dla dziecka na zimę – kolor grafitowy, rozm. 80");
  });

  it("bez „na zimę” dla cienkich, lekkich i przejściowych; cienkie swetry męskie zachowują „cienki”", () => {
    const czapka = P({ nazwa: "Czapka dzianiny pomponem Przejściowa", rozmiary: ["26-30 cm"] });
    expect(tytulGoogle(czapka, "26-30 cm", {}, new Set())).toBe("Czapka dzianiny pomponem przejściowa dla niemowlaka – rozm. 26-30 cm");
    const sweter = P({ nazwa: "Sweter męski rozpinany półgolf klasyczny fason", opis: "Cienki, lekki sweter", kategoria: "dorosli", rozmiary: ["L"] });
    expect(tytulGoogle(sweter, "L", {}, new Set())).toBe("Sweter męski cienki rozpinany półgolf klasyczny fason – rozm. L");
  });

  it("nie dubluje koloru ani rozmiaru, gdy są już w nazwie", () => {
    const p = P({ nazwa: "Kamizelka bezrękawnik sweterkowa dzianina szara", kolor: "szary (siwy)", rozmiary: ["74"] });
    expect(tytulGoogle(p, "74", OK(p), new Set())).toBe("Kamizelka bezrękawnik sweterkowa dzianina szara dla niemowlaka na zimę – rozm. 74");
    const q = P({ nazwa: "3 cz. komplet dres niemowlęcy body bluza spodnie 56", rozmiary: ["56"] });
    expect(tytulGoogle(q, "56", {}, new Set())).toBe("3 cz. komplet dres niemowlęcy body bluza spodnie 56");
  });

  it("produkty z listy „bez zmian” (kolor niezgodny ze zdjęciem) zostają z dotychczasowym tytułem", () => {
    const p = P({ id: "x9", nazwa: "Spodnie dresowe dla chłopca Dziecięce Regulacja", kolor: "brązowy" });
    expect(tytulGoogle(p, "98", OK(p), new Set(["x9"]))).toBe("Spodnie dresowe dla chłopca Dziecięce Regulacja");
  });

  it("porządki: T-shirt, bez wielkich liter w środku i capsa, cudzysłowy, bez haseł promocyjnych", () => {
    expect(uporzadkujNazwe("T shirt Bluzka krótki rękaw do przedszkola")).toBe("T-shirt bluzka krótki rękaw do przedszkola");
    expect(uporzadkujNazwe('Komplet body półśpiochy " babcia tu była " SZARY')).toBe("Komplet body półśpiochy „babcia tu była” szary");
    expect(uporzadkujNazwe("Body PROMOCJA niemowlęce!!! Hit")).toBe("Body niemowlęce");
  });

  it("kolor do tytułu: konkretny odcień, czytelne nazwy, bez „inny” i „wielokolorowy”", () => {
    expect(kolorDoTytulu("niebieski (granatowy)")).toBe("granatowy");
    expect(kolorDoTytulu("szary (gołębi)")).toBe("szary gołębi");
    expect(kolorDoTytulu("biały (ecru)")).toBe("ecru");
    expect(kolorDoTytulu("CHABER")).toBe("chabrowy");
    expect(kolorDoTytulu("wielokolorowy")).toBeNull();
    expect(kolorDoTytulu("inny")).toBeNull();
  });

  it("lista sprawdzonych kolorów: ~545 produktów, bez produktów z listy „bez zmian”", () => {
    expect(Object.keys(KOLORY_ZWERYFIKOWANE).length).toBeGreaterThan(500);
    expect([...TYTUL_BEZ_ZMIAN].some((id) => id in KOLORY_ZWERYFIKOWANE)).toBe(false);
  });

  it("limit 150 znaków — kolor i rozmiar zawsze zostają na końcu", () => {
    const p = P({ nazwa: "Komplet " + "bardzo długa nazwa ".repeat(12), kolor: "czarny" });
    const t = tytulGoogle(p, "68", OK(p), new Set());
    expect(t.length).toBeLessThanOrEqual(150);
    expect(t).toMatch(/– kolor czarny, rozm\. 68$/);
  });
});
