import { describe, expect, it } from "vitest";
import type { Produkt } from "@/data/produkty";
import { artykulTygodnia, tematNewslettera, tydzienRoku, wybierzNowosci } from "@/lib/newsletterDobor";

const p = (id: string, kategoria: string, stan: number, nazwa = id) => ({ id, kategoria, stan, nazwa }) as unknown as Produkt;

describe("newsletter: dobór nowości", () => {
  const katalog = [
    p("stary", "niemowleta", 5),
    p("nowy-a", "dziewczynki", 2),
    p("nowy-b", "chlopcy", 1),
    p("nowy-wyprzedany", "niemowleta", 0),
    p("nowy-dorosly", "dorosli", 3),
  ];
  const dodane = new Map([
    ["nowy-a", "2026-10-28T10:00:00Z"],
    ["nowy-b", "2026-10-30T10:00:00Z"],
    ["nowy-wyprzedany", "2026-10-31T10:00:00Z"],
    ["nowy-dorosly", "2026-10-31T11:00:00Z"],
  ]);

  it("tylko nowe z tygodnia, dziecięce, na stanie — od najnowszego", () => {
    expect(wybierzNowosci(katalog, dodane).map((x) => x.id)).toEqual(["nowy-b", "nowy-a"]);
  });

  it("nic nowego → pusta lista (newsletter się nie wysyła)", () => {
    expect(wybierzNowosci(katalog, new Map())).toEqual([]);
  });

  it("limit produktów", () => {
    expect(wybierzNowosci(katalog, dodane, 1).map((x) => x.id)).toEqual(["nowy-b"]);
  });

  it("co tydzień inny poradnik, w obrębie tygodnia ten sam", () => {
    const art = ["a", "b", "c", "d", "e"];
    const czw = new Date("2026-10-29T09:00:00Z");
    const pt = new Date("2026-10-30T09:00:00Z");
    const kolejny = new Date("2026-11-05T09:00:00Z");
    expect(artykulTygodnia(art, czw)).toBe(artykulTygodnia(art, pt));
    expect(artykulTygodnia(art, czw)).not.toBe(artykulTygodnia(art, kolejny));
    expect(tydzienRoku(new Date("2026-01-01T12:00:00Z"))).toBe(1);
    expect(artykulTygodnia([], czw)).toBeUndefined();
  });

  it("temat z nazwą nowości", () => {
    expect(tematNewslettera([{ nazwa: "Pajac w misie" }])).toBe("Nowość tygodnia: Pajac w misie");
    expect(tematNewslettera([{ nazwa: "Pajac" }, { nazwa: "Body" }])).toBe("Nowości tygodnia: Pajac i więcej");
    expect(tematNewslettera([{ nazwa: "x".repeat(80) }]).length).toBeLessThan(70);
    expect(tematNewslettera([{ nazwa: "Spodnie Dresowe Chłopięce Wygodne sportowe kieszenie" }, { nazwa: "b" }])).toBe(
      "Nowości tygodnia: Spodnie Dresowe Chłopięce Wygodne sportowe… i więcej",
    );
  });
});
