import { describe, expect, it } from "vitest";
import { telefonE164 } from "@/lib/analityka";

// Konwersje rozszerzone Google Ads: telefon w formacie E.164.
describe("telefon do konwersji rozszerzonych", () => {
  it("polskie numery w różnych zapisach → +48 i 9 cyfr", () => {
    expect(telefonE164("500 600 700")).toBe("+48500600700");
    expect(telefonE164("+48 500-600-700")).toBe("+48500600700");
    expect(telefonE164("0048500600700")).toBe("+48500600700");
  });
  it("niepełny albo pusty numer → brak", () => {
    expect(telefonE164("12345")).toBeUndefined();
    expect(telefonE164("")).toBeUndefined();
    expect(telefonE164(undefined)).toBeUndefined();
  });
});
