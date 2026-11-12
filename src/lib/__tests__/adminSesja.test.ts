import { beforeEach, describe, expect, it } from "vitest";
import { tokenAdmina, tokenAdminaOk, WAZNOSC_SESJI_MS } from "@/lib/adminAuth";

// Sesja panelu: podpisana, z terminem ważności (8 h), unieważniana zmianą hasła.
describe("sesja admina", () => {
  beforeEach(() => {
    process.env.ADMIN_HASLO = "haslo-testowe-1";
  });

  it("świeży token działa, po 8 h już nie", () => {
    const t0 = Date.UTC(2026, 10, 12, 10);
    const t = tokenAdmina(t0);
    expect(tokenAdminaOk(t, t0 + 1000)).toBe(true);
    expect(tokenAdminaOk(t, t0 + WAZNOSC_SESJI_MS + 1)).toBe(false);
  });

  it("podrobiony lub przedłużony token nie działa", () => {
    const t0 = Date.now();
    const [exp, sig] = tokenAdmina(t0).split(".");
    expect(tokenAdminaOk(`${Number(exp) + 3600_000}.${sig}`, t0)).toBe(false); // zmieniony termin
    expect(tokenAdminaOk(`${exp}.${"0".repeat(64)}`, t0)).toBe(false);
    expect(tokenAdminaOk("", t0)).toBe(false);
    expect(tokenAdminaOk("cokolwiek", t0)).toBe(false);
  });

  it("zmiana hasła unieważnia sesje; stary format (sam skrót hasła) nie działa", () => {
    const t = tokenAdmina();
    process.env.ADMIN_HASLO = "nowe-haslo-2";
    expect(tokenAdminaOk(t)).toBe(false);
    expect(tokenAdminaOk("a".repeat(64))).toBe(false);
  });
});
