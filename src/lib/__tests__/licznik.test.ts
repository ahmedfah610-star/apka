import { describe, expect, it } from "vitest";
import { agregujLejek, dodaj, dzien } from "@/lib/licznik";

describe("licznik wejść", () => {
  it("dzień w strefie Europe/Warsaw (północ UTC to już następny dzień w Polsce latem)", () => {
    expect(dzien(new Date("2026-07-01T22:30:00Z"))).toBe("2026-07-02");
    expect(dzien(new Date("2026-12-01T22:30:00Z"))).toBe("2026-12-01");
  });

  it("dodaje wejścia i dodania do koszyka", () => {
    let d = dodaj({}, "p1", "w");
    d = dodaj(d, "p1", "w");
    d = dodaj(d, "p1", "k");
    expect(d.p1).toEqual([2, 1]);
  });

  it("lejek: sumuje dni i sprzedaż", () => {
    const wiersze = agregujLejek(
      [{ p1: [10, 2] }, { p1: [5, 1], p2: [3, 0] }],
      [
        { pozycje: [{ id: "p1", ilosc: 2 }, { id: "p2", ilosc: 1 }] },
        { pozycje: [{ id: "p1", ilosc: 1 }] },
      ],
    );
    const p1 = wiersze.find((w) => w.id === "p1")!;
    const p2 = wiersze.find((w) => w.id === "p2")!;
    expect(p1).toMatchObject({ wejscia: 15, koszyk: 3, kupione: 3, zamowien: 2 });
    expect(p2).toMatchObject({ wejscia: 3, koszyk: 0, kupione: 1, zamowien: 1 });
  });
});
