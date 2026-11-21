import { describe, expect, it } from "vitest";
import vm from "node:vm";
import { ZGODY_DOMYSLNE } from "@/lib/zgody";

// Strona 404 nie ma skryptów z <head> — zgody domyślne ustawia wtedy inicjalizacja tagu.
// Na zwykłych stronach skrypt wykonuje się dwa razy (head + inicjalizacja): drugi raz nic nie dodaje.
function przegladarka() {
  const okno: Record<string, unknown> = {};
  okno.window = okno;
  vm.createContext(okno);
  return okno as { dataLayer?: ArrayLike<unknown>[]; gtag?: unknown };
}

describe("zgody domyślne Google (Consent Mode)", () => {
  it("raz: definiuje gtag i jako pierwsze wysyła odmowę wszystkich zgód", () => {
    const okno = przegladarka();
    vm.runInContext(ZGODY_DOMYSLNE, okno);
    expect(typeof okno.gtag).toBe("function");
    const [pierwszy] = okno.dataLayer!;
    expect(Array.from(pierwszy).slice(0, 2)).toEqual(["consent", "default"]);
    expect((pierwszy as unknown[])[2]).toMatchObject({ ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });

  it("drugi raz (head + inicjalizacja tagu) — bez duplikatów", () => {
    const okno = przegladarka();
    vm.runInContext(ZGODY_DOMYSLNE, okno);
    vm.runInContext(ZGODY_DOMYSLNE, okno);
    expect(okno.dataLayer!.length).toBe(3); // consent default + ads_data_redaction + url_passthrough
  });
});
