import { describe, expect, it } from "vitest";
import { duzyRozmiar, powodWykluczenia, wykluczeniaReklam } from "@/data/wykluczoneZReklam";

describe("wykluczenia z reklam", () => {
  it("komplet z ręcznej listy nie idzie do reklam Zakupów", () => {
    expect(wykluczeniaReklam({ id: "al-m-1sdb64a", nazwa: "Komplet", kategoria: "niemowleta", stan: 5 } as never)).toEqual(["Shopping_ads", "Display_ads"]);
  });
  it("męskie spodnie dresowe — wyłączone, swetry — reklamowane", () => {
    expect(powodWykluczenia({ id: "a", nazwa: "Spodnie Dresowe męskie ocieplane", kategoria: "dorosli", stan: 9 } as never)).not.toBeNull();
    expect(powodWykluczenia({ id: "b", nazwa: "Sweter męski rozpinany półgolf", kategoria: "dorosli", stanRozmiary: { L: 1 } } as never)).toBeNull();
  });
  it("dziecięce z ostatnią sztuką — wyłączone, chyba że to napisy dla rodziny", () => {
    expect(powodWykluczenia({ id: "c", nazwa: "Kamizelka bezrękawnik", kategoria: "dziewczynki", stanRozmiary: { "92": 1, "98": 0 } } as never)).not.toBeNull();
    expect(powodWykluczenia({ id: "d", nazwa: "Body długi rękaw babcia tu była", kategoria: "niemowleta", stanRozmiary: { "62": 1 } } as never)).toBeNull();
    expect(powodWykluczenia({ id: "e", nazwa: "Body niemowlęce długi rękaw Mały Prezes", kategoria: "niemowleta", stan: 1 } as never)).toBeNull();
    expect(powodWykluczenia({ id: "f", nazwa: "Sweterek dla chłopca ciepły miś", kategoria: "chlopcy", stanRozmiary: { "80": 1, "92": 2 } } as never)).toBeNull();
  });
  it("duże rozmiary: 3XL–9XL", () => {
    expect(["3XL", "5xl", "7XL"].every(duzyRozmiar)).toBe(true);
    expect(["XXL", "XL", "L", "92", undefined].some((r) => duzyRozmiar(r as string))).toBe(false);
  });
});
