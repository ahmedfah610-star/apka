import { describe, expect, it } from "vitest";
import { czekaNaWplate } from "@/lib/statusyZamowien";

// Wpłata (także powtórzone powiadomienie Przelewy24) zmienia zamówienie tylko, gdy czekało na zapłatę.
describe("czekaNaWplate", () => {
  it("opłaca zamówienie oczekujące i anulowane (pieniądze doszły)", () => {
    expect(czekaNaWplate("oczekuje_na_platnosc")).toBe(true);
    expect(czekaNaWplate("anulowane")).toBe(true);
  });
  it("nie rusza opłaconego, wysłanego ani złożonego bez płatności online (bez drugiego zdjęcia stanu)", () => {
    for (const s of ["oplacone", "wyslane", "nowe", undefined, null, ""]) expect(czekaNaWplate(s)).toBe(false);
  });
});
