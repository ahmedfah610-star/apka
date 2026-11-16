import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { kwotaZapamietanegoZakupu, zglosZakup } from "@/lib/analityka";

function pamiec() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("zgłaszanie zakupu", () => {
  let wywolania: unknown[][];

  beforeEach(() => {
    wywolania = [];
    vi.stubGlobal("localStorage", pamiec());
    vi.stubGlobal("window", {
      location: { pathname: "/zamowienie/dziekujemy" },
      bobasGa: true,
      gtag: (...a: unknown[]) => wywolania.push(a),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("liczy kwotę z koszyka zapamiętanego przed płatnością (produkty − rabat + dostawa)", () => {
    localStorage.setItem(
      "bobas-zakup-oczekujacy",
      JSON.stringify({ pozycje: [{ id: "a", nazwa: "Body", cena: 22.5, ilosc: 2 }], dostawa: 10.5, rabat: 5, czas: Date.now() }),
    );
    expect(kwotaZapamietanegoZakupu()).toBe(50.5);
  });

  it("bez świeżego koszyka nie zgaduje kwoty", () => {
    expect(kwotaZapamietanegoZakupu()).toBeNull();
    localStorage.setItem("bobas-zakup-oczekujacy", JSON.stringify({ pozycje: [{ id: "a", nazwa: "B", cena: 10, ilosc: 1 }], czas: Date.now() - 3 * 86400000 }));
    expect(kwotaZapamietanegoZakupu()).toBeNull();
  });

  it("przy wyjściu ze strony wysyła konwersję Google Ads i GA4 jako beacon — raz na zamówienie", () => {
    expect(zglosZakup("zam-1", 57.25, { beacon: true })).toBe(true);
    const konwersja = wywolania.find((a) => a[0] === "event" && a[1] === "conversion")?.[2] as Record<string, unknown>;
    const zakup = wywolania.find((a) => a[0] === "event" && a[1] === "purchase")?.[2] as Record<string, unknown>;
    expect(konwersja).toMatchObject({ transport_type: "beacon", value: 57.25, currency: "PLN", transaction_id: "zam-1" });
    expect(zakup).toMatchObject({ transport_type: "beacon", value: 57.25, transaction_id: "zam-1" });

    wywolania = [];
    zglosZakup("zam-1", 57.25);
    expect(wywolania.some((a) => a[1] === "conversion")).toBe(false);
  });

  it("zwykłe zgłoszenie (po potwierdzeniu płatności) nie ustawia beacona", () => {
    zglosZakup("zam-2", 40);
    const konwersja = wywolania.find((a) => a[1] === "conversion")?.[2] as Record<string, unknown>;
    expect(konwersja.transport_type).toBeUndefined();
  });
});
