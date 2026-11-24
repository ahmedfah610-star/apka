import { describe, expect, it } from "vitest";
import { indeksyBraku, kwotaZwrotu } from "@/lib/brakTowaru";
import { mailBrakTowaruHtml, mailKodPowitalnyHtml, tematBrakuTowaru } from "@/lib/mail";

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

  it("imię i nazwa produktu bezpieczne i bez podwójnego kodowania; kod mieści się na małym telefonie", () => {
    const html = mailBrakTowaruHtml({ ...baza, imie: "Ola&Jan <b>", brakujace: [{ ...z.pozycje[0], nazwa: "Body <script>alert(1)</script>" }], calosc: false, kwota: 9, zwrot: "konto" });
    expect(html).toContain("Ola&amp;Jan, bardzo przepraszamy");
    expect(html).not.toContain("&amp;amp;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Body &lt;script&gt;");
    expect(html).toMatch(/font-size:26px;font-weight:800;letter-spacing:\.03em[^>]*>NADROBIMY10</);
  });
  it("jeden produkt — liczba pojedyncza, kilka — mnoga", () => {
    expect(mailBrakTowaruHtml({ ...baza, brakujace: [z.pozycje[0]], calosc: false, kwota: 9, zwrot: "zwrocone" })).toContain("Za brakujący produkt 9,00 zł");
    const wiele = mailBrakTowaruHtml({ ...baza, brakujace: z.pozycje, calosc: false, kwota: 9, zwrot: "zwrocone" });
    expect(wiele).toContain("Za brakujące produkty 9,00 zł");
    expect(wiele).toContain("ostatnie sztuki sprzedały się");
  });

  it("ta sama poprawka w mailu z kodem powitalnym (bez „&amp;amp;”)", () => {
    const html = mailKodPowitalnyHtml({ imie: "Ola&Jan", kod: "NOWY5", procent: 5, produkty: [] });
    expect(html).toContain("Cześć Ola&amp;Jan!");
    expect(html).not.toContain("&amp;amp;");
  });

  it("z potwierdzeniem zwrotu — zdanie o załączniku; bez pliku albo przy prośbie o konto — bez niego", () => {
    const zal = { nazwa: "potwierdzenie-zwrotu.pdf", tresc: new Uint8Array([37, 80, 68, 70]) };
    const z1 = mailBrakTowaruHtml({ ...baza, brakujace: [z.pozycje[0]], calosc: false, kwota: 9, zwrot: "zwrocone", zalacznik: zal, dataZwrotu: "2026-11-24T10:00:00Z" });
    expect(z1).toContain("Potwierdzenie zwrotu");
    expect(z1).toContain("Data zlecenia zwrotu");
    expect(z1).toContain("24.11.2026");
    expect(z1).toContain("w załączniku");
    const bezPliku = mailBrakTowaruHtml({ ...baza, brakujace: [z.pozycje[0]], calosc: false, kwota: 9, zwrot: "zwrocone" });
    expect(bezPliku).toContain("Potwierdzenie zwrotu"); // sam mail też potwierdza zwrot
    expect(bezPliku).not.toContain("w załączniku");
    const konto = mailBrakTowaruHtml({ ...baza, brakujace: [z.pozycje[0]], calosc: false, kwota: 9, zwrot: "konto", zalacznik: zal });
    expect(konto).not.toContain("Potwierdzenie zwrotu");
    expect(tematBrakuTowaru({ id: baza.id, zwrot: "zwrocone" })).toBe("Twoje zamówienie #a1b2c3d4 — brak produktu i potwierdzenie zwrotu pieniędzy");
    expect(tematBrakuTowaru({ id: baza.id, zwrot: "konto" })).toBe("Twoje zamówienie #a1b2c3d4 — brak produktu i zwrot pieniędzy");
  });
});
