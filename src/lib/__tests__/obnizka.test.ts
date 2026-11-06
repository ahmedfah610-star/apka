import { describe, expect, it } from "vitest";
import { cenaPrzedObnizka, procentObnizki } from "@/lib/obnizka";

describe("obniżka z plakietki", () => {
  it("rozpoznaje plakietki z procentem", () => {
    expect(procentObnizki("-20%")).toBe(20);
    expect(procentObnizki("−15 %")).toBe(15);
    expect(procentObnizki("NOWOŚĆ")).toBeNull();
    expect(procentObnizki("BESTSELLER")).toBeNull();
    expect(procentObnizki(null)).toBeNull();
    expect(procentObnizki("-95%")).toBeNull();
  });
  it("cena w panelu jest po obniżce — przekreślona doliczona z procentu", () => {
    expect(cenaPrzedObnizka({ badge: "-20%", cena: 29.99 })).toBe(37.49);
    expect(cenaPrzedObnizka({ badge: "-20%", cena: 15 })).toBe(18.75);
    expect(cenaPrzedObnizka({ badge: "NOWOŚĆ", cena: 15 })).toBeNull();
  });
});
