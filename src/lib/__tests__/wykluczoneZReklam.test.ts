import { describe, expect, it } from "vitest";
import { wykluczeniaReklam } from "@/data/wykluczoneZReklam";

describe("wykluczenia z reklam", () => {
  it("komplet z 1 sztuką na rozmiar nie idzie do reklam Zakupów", () => {
    expect(wykluczeniaReklam("al-m-1sdb64a")).toEqual(["Shopping_ads", "Display_ads"]);
  });
  it("pozostałe produkty reklamujemy bez zmian", () => {
    expect(wykluczeniaReklam("al-m-gn0pas")).toEqual([]);
  });
});
