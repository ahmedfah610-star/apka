import { describe, expect, it } from "vitest";
import { indeksyBraku, kwotaZwrotu } from "@/lib/brakTowaru";
import { mailBrakTowaruHtml } from "@/lib/mail";

const z = {
  pozycje: [
    { nazwa: "Czapka", cena: 10, ilosc: 2, rozmiar: "62" },
    { nazwa: "Body", cena: 30, ilosc: 1, rozmiar: "68", kolor: "różowy" },
  ],
  suma: 50,
  rabat: 5, // rabat z kodu: 5 zł z 50 zł
  razem: 52.26, // 45 + 7,26 dostawy
};

describe("brak towaru — kwota zwrotu", () => {
  it("brakuje wszystkiego → cała zapłacona kwota z dostawą", () => {
    expect(kwotaZwrotu(z, [0, 1])).toEqual({ kwota: 52.26, calosc: true });
  });
  it("brakuje części → wartość pozycji minus jej część rabatu, dostawa zostaje", () => {
    expect(kwotaZwrotu(z, [1])).toEqual({ kwota: 27, calosc: false }); // 30 − 30/50·5
    expect(kwotaZwrotu({ ...z, rabat: 0 }, [0])).toEqual({ kwota: 20, calosc: false });
  });
  it("indeksy z panelu: tylko istniejące, bez powtórek", () => {
    expect(indeksyBraku(z.pozycje, [1, 1, "0", 7, -1, "x"])).toEqual([0, 1]);
    expect(indeksyBraku(z.pozycje, "1")).toEqual([]);
  });
});

describe("mail o braku towaru", () => {
  const baza = { id: "a1b2c3d4-0000-4000-8000-000000000000", email: "anna@example.com", imie: "Anna Kowalska", kod: "NADROBIMY10", procentKodu: 10 };
  it("zwrot już zrobiony: przeprosiny, numer zamówienia, kwota, kod, pozostałe wyślemy", () => {
    const html = mailBrakTowaruHtml({ ...baza, brakujace: [z.pozycje[1]], calosc: false, kwota: 27, zwrot: "zwrocone" });
    expect(html).toContain("Anna, bardzo przepraszamy");
    expect(html).toContain("#a1b2c3d4");
    expect(html).toContain("27,00 zł już zwróciliśmy");
    expect(html).toContain("NADROBIMY10");
    expect(html).toContain("Pozostałe produkty z zamówienia wyślemy normalnie");
  });
  it("prośba o numer konta, całe zamówienie — bez zdania o wysyłce reszty", () => {
    const html = mailBrakTowaruHtml({ ...baza, brakujace: z.pozycje, calosc: true, kwota: 52.26, zwrot: "konto" });
    expect(html).toContain("Zwrócimy Ci 52,26 zł");
    expect(html).toContain("numerem konta");
    expect(html).not.toContain("Pozostałe produkty");
  });
});
