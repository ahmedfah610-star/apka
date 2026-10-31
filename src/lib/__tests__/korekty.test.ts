import { describe, expect, it } from "vitest";
import { obliczKorekte, skorygowano, zwroconoLacznie, type Korekta, type ZamowienieDoKorekty } from "@/lib/korekty";

const zam = (o: Partial<ZamowienieDoKorekty> = {}): ZamowienieDoKorekty => ({
  pozycje: [
    { nazwa: "Body", cena: 20, ilosc: 2, rozmiar: "74" },
    { nazwa: "Czapka", cena: 10, ilosc: 1 },
  ],
  suma: 50,
  rabat: 0,
  dostawa: 10.5,
  razem: 60.5,
  ...o,
});
const ok = (r: ReturnType<typeof obliczKorekte>) => {
  if ("blad" in r) throw new Error(r.blad);
  return r.korekta;
};

describe("korekty zamówienia", () => {
  it("brak jednej sztuki — kwota z ceny w zamówieniu", () => {
    const k = ok(obliczKorekte(zam(), { typ: "brak", pozycje: [{ indeks: 0, ilosc: 1 }] }));
    expect(k.kwota).toBe(20);
    expect(k.pozycje[0]).toMatchObject({ nazwa: "Body", rozmiar: "74", ilosc: 1 });
    expect(k.dostawa).toBe(0);
  });

  it("rabat rozkłada się proporcjonalnie (zwracamy to, co klient zapłacił)", () => {
    const k = ok(obliczKorekte(zam({ rabat: 5, razem: 55.5 }), { typ: "zwrot", pozycje: [{ indeks: 1, ilosc: 1 }] }));
    expect(k.kwota).toBe(9); // 10 zł × (1 − 5/50)
  });

  it("zwrot całości z dostawą — dostawa tylko raz, suma nie większa niż zapłacono", () => {
    const k = ok(obliczKorekte(zam(), { typ: "zwrot", pozycje: [{ indeks: 0, ilosc: 2 }, { indeks: 1, ilosc: 1 }], zwrotDostawy: true }));
    expect(k.kwota).toBe(60.5);
    const druga = obliczKorekte(zam({ korekty: [k] }), { typ: "zwrot", pozycje: [], zwrotDostawy: true });
    expect("blad" in druga).toBe(true);
  });

  it("nie da się rozliczyć więcej sztuk, niż zamówiono (łącznie z wcześniejszymi korektami)", () => {
    const pierwsza = ok(obliczKorekte(zam(), { typ: "brak", pozycje: [{ indeks: 0, ilosc: 1 }] }));
    const korekty: Korekta[] = [pierwsza];
    expect(skorygowano(korekty, 0)).toBe(1);
    expect("blad" in obliczKorekte(zam({ korekty }), { typ: "zwrot", pozycje: [{ indeks: 0, ilosc: 2 }] })).toBe(true);
    expect(ok(obliczKorekte(zam({ korekty }), { typ: "zwrot", pozycje: [{ indeks: 0, ilosc: 1 }] })).kwota).toBe(20);
    expect(zwroconoLacznie(korekty)).toBe(20);
  });

  it("błędne dane — odmowa", () => {
    expect("blad" in obliczKorekte(zam(), { typ: "inne", pozycje: [{ indeks: 0, ilosc: 1 }] })).toBe(true);
    expect("blad" in obliczKorekte(zam(), { typ: "brak", pozycje: [{ indeks: 9, ilosc: 1 }] })).toBe(true);
    expect("blad" in obliczKorekte(zam(), { typ: "brak", pozycje: [] })).toBe(true);
    expect("blad" in obliczKorekte(zam(), { typ: "brak", pozycje: [{ indeks: 0, ilosc: 1 }, { indeks: 0, ilosc: 1 }] })).toBe(true);
  });
});
