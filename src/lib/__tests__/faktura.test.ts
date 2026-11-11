import { describe, expect, it } from "vitest";
import {
  nipPoprawny,
  normalizujNip,
  nipCzytelny,
  normalizujKod,
  sprawdzFakture,
  stanFaktury,
  fakturDoWystawienia,
  tekstDoFaktury,
  bezpiecznaNazwaPliku,
  nazwaPlikuDokumentu,
  MAX_UWAGI_FAKTURY,
  type DaneFaktury,
} from "@/lib/faktura";

// Dane do faktury: walidacja w formularzu i na serwerze, stan w panelu, tekst do programu do faktur.
const FIRMA = { typ: "firma", nip: "526-025-02-74", nazwa: "Kwiatek i Syn Sp. z o.o.", adres: "ul. Lipowa 12/4", kod: "20001", miasto: "Lublin" };

describe("NIP i kod pocztowy", () => {
  it("cyfra kontrolna NIP, spacje/kreski/PL nie przeszkadzają", () => {
    expect(nipPoprawny("5260250274")).toBe(true);
    expect(nipPoprawny("526-025-02-74")).toBe(true);
    expect(nipPoprawny("PL 526 025 02 74")).toBe(true);
    expect(nipPoprawny("5260250275")).toBe(false); // zła cyfra kontrolna
    expect(nipPoprawny("123")).toBe(false);
    expect(nipPoprawny("0000000000")).toBe(false);
    expect(normalizujNip("pl526-025 02 74")).toBe("5260250274");
    expect(nipCzytelny("5260250274")).toBe("526-025-02-74");
  });
  it("kod pocztowy z kreską", () => {
    expect(normalizujKod("20001")).toBe("20-001");
    expect(normalizujKod("20 001")).toBe("20-001");
    expect(normalizujKod("20-001")).toBe("20-001");
  });
});

describe("sprawdzanie danych do faktury", () => {
  it("brak faktury = null (zamówienie bez faktury)", () => {
    expect(sprawdzFakture(undefined)).toEqual({ ok: true, faktura: null });
    expect(sprawdzFakture(null)).toEqual({ ok: true, faktura: null });
  });

  it("firma: czyści dane, NIP bez kresek, kod z kreską, kraj PL", () => {
    const w = sprawdzFakture({ ...FIRMA, email: "KSIEGOWOSC@Kwiatek.pl", uwagi: "  Proszę o FV z datą sprzedaży  " });
    expect(w).toEqual({
      ok: true,
      faktura: {
        typ: "firma",
        nip: "5260250274",
        nazwa: "Kwiatek i Syn Sp. z o.o.",
        adres: "ul. Lipowa 12/4",
        kod: "20-001",
        miasto: "Lublin",
        kraj: "PL",
        email: "ksiegowosc@kwiatek.pl",
        uwagi: "Proszę o FV z datą sprzedaży",
      },
    });
  });

  it("firma: zły lub brakujący NIP, brak nazwy", () => {
    expect(sprawdzFakture({ ...FIRMA, nip: "" })).toMatchObject({ ok: false, blad: expect.stringMatching(/NIP/) });
    expect(sprawdzFakture({ ...FIRMA, nip: "5260250275" })).toMatchObject({ ok: false, blad: expect.stringMatching(/nieprawidłowy/) });
    expect(sprawdzFakture({ ...FIRMA, nazwa: " " })).toMatchObject({ ok: false, blad: expect.stringMatching(/nazwę firmy/) });
  });

  it("osoba prywatna: bez NIP (nawet gdy przyjdzie), wymagany adres", () => {
    const w = sprawdzFakture({ typ: "osoba", nip: "5260250274", nazwa: "Anna Kowalska", adres: "Polna 1", kod: "00-001", miasto: "Warszawa" });
    expect(w.ok && w.faktura).toEqual({ typ: "osoba", nazwa: "Anna Kowalska", adres: "Polna 1", kod: "00-001", miasto: "Warszawa", kraj: "PL" });
    expect(sprawdzFakture({ typ: "osoba", nazwa: "Anna Kowalska", adres: "", kod: "00-001", miasto: "W-wa" })).toMatchObject({ ok: false, blad: expect.stringMatching(/ulicę/) });
    expect(sprawdzFakture({ typ: "osoba", nazwa: "Anna Kowalska", adres: "Polna 1", kod: "001", miasto: "Warszawa" })).toMatchObject({ ok: false, blad: expect.stringMatching(/00-000/) });
  });

  it("zły e-mail na fakturę, znaczniki HTML usunięte, uwagi przycięte", () => {
    expect(sprawdzFakture({ ...FIRMA, email: "nie-mail" })).toMatchObject({ ok: false });
    const w = sprawdzFakture({ ...FIRMA, nazwa: "<b>Firma</b> X", uwagi: "a".repeat(MAX_UWAGI_FAKTURY + 50) });
    expect(w.ok && w.faktura?.nazwa).toBe("bFirma/b X");
    expect(w.ok && w.faktura?.uwagi?.length).toBe(MAX_UWAGI_FAKTURY);
  });
});

describe("stan faktury w panelu", () => {
  const f = sprawdzFakture(FIRMA);
  const faktura = f.ok ? f.faktura : null;
  it("do wystawienia tylko po opłaceniu; gotowa po wgraniu faktury", () => {
    expect(stanFaktury({ status: "oplacone", klient: {} })).toBe("brak");
    expect(stanFaktury({ status: "oczekuje_na_platnosc", klient: { faktura } })).toBe("czeka");
    expect(stanFaktury({ status: "oplacone", klient: { faktura } })).toBe("do-wystawienia");
    expect(stanFaktury({ status: "wyslane", klient: { faktura, dokumenty: [{ typ: "dowod" } as never] } })).toBe("do-wystawienia");
    expect(stanFaktury({ status: "wyslane", klient: { faktura, dokumenty: [{ typ: "faktura" } as never] } })).toBe("gotowa");
  });
  it("licznik na pulpit — bez zamówień testowych", () => {
    const osoba = { ...faktura!, typ: "osoba" as const, nip: undefined };
    expect(
      fakturDoWystawienia([
        { status: "oplacone", klient: { faktura } },
        { status: "wyslane", klient: { faktura: osoba } },
        { status: "oplacone", klient: { faktura, test: true } },
        { status: "anulowane", klient: { faktura } },
      ]),
    ).toEqual({ razem: 2, firmy: 1, osoby: 1 });
  });
});

describe("tekst do programu do faktur", () => {
  it("nabywca, pozycje, rabat, dostawa, płatność, data wysyłki", () => {
    const t = tekstDoFaktury({
      id: "31d013de-5b1d-4e2a-9f3c-0d8e6a1b2c3d",
      data: "2026-11-10T09:00:00Z",
      pozycje: [{ nazwa: "Komplet dres", cena: 59.99, ilosc: 2, rozmiar: "68", kolor: "szary" }],
      dostawa: 13.99,
      razem: 128.97,
      rabat: 5,
      kodRabatowy: "ZIMA5",
      metoda: "InPost Paczkomat 24/7 · Przelewy24",
      status: "wyslane",
      wyslanoAt: "2026-11-11T10:00:00Z",
      klient: { faktura: (sprawdzFakture({ ...FIRMA, uwagi: "FV z datą sprzedaży" }) as { faktura: DaneFaktury }).faktura },
    });
    expect(t).toContain("NABYWCA (firma)");
    expect(t).toContain("NIP: 526-025-02-74");
    expect(t).toContain("20-001 Lublin");
    expect(t).toContain("Uwagi do faktury: FV z datą sprzedaży");
    expect(t).toContain("- Komplet dres, kolor szary, rozm. 68 — 2 szt. × 59,99 zł = 119,98 zł");
    expect(t).toContain("- Rabat (kod ZIMA5): −5,00 zł");
    expect(t).toContain("- Dostawa (InPost Paczkomat 24/7): 13,99 zł");
    expect(t).toContain("RAZEM: 128,97 zł");
    expect(t).toContain("Przelewy24 — zapłacono");
    expect(t).toContain("Data sprzedaży (wysyłki): 11.11.2026");
  });
});

it("bezpieczna nazwa pliku", () => {
  expect(bezpiecznaNazwaPliku("Faktura FV 12/11/2026 — Łódź.pdf")).toBe("Faktura_FV_12_11_2026_Lodz.pdf");
  expect(bezpiecznaNazwaPliku("../../etc/passwd")).toBe("etc_passwd");
  expect(bezpiecznaNazwaPliku("")).toBe("dokument");
});

it("nazwa załącznika z numeru dokumentu", () => {
  expect(nazwaPlikuDokumentu("faktura", "FV 12/11/2026", "31d013de-xx", "pdf")).toBe("Faktura_FV_12_11_2026.pdf");
  expect(nazwaPlikuDokumentu("dowod", "", "31d013de-xx", "jpg")).toBe("Dowod_zakupu_31d013de.jpg");
  expect(nazwaPlikuDokumentu("korekta", "FK 2/11", "31d013de-xx", "pdf")).toBe("Korekta_FK_2_11.pdf");
});
