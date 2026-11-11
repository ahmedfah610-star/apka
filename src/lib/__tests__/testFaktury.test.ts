import { describe, expect, it } from "vitest";
import { zamowienieTestoweFaktury } from "@/lib/testFaktury";
import { sprawdzFakture, stanFaktury } from "@/lib/faktura";

describe("zamówienie testowe do faktury", () => {
  it("0 zł, znacznik TEST, poprawne dane do faktury, czeka na wystawienie", () => {
    const t = zamowienieTestoweFaktury("  Ktos@Example.PL ");
    if (!t.ok) throw new Error(t.blad);
    const w = t.wiersz as { razem: number; suma: number; dostawa: number; status: string; klient: { email: string; test: boolean; faktura: unknown } };
    expect([w.razem, w.suma, w.dostawa]).toEqual([0, 0, 0]);
    expect(w.klient.test).toBe(true);
    expect(w.klient.email).toBe("ktos@example.pl");
    expect(sprawdzFakture(w.klient.faktura).ok).toBe(true);
    expect(stanFaktury(w as never)).toBe("do-wystawienia");
  });

  it("bez prawidłowego e-maila — odmowa", () => {
    expect(zamowienieTestoweFaktury("zly").ok).toBe(false);
    expect(zamowienieTestoweFaktury(undefined).ok).toBe(false);
  });
});
