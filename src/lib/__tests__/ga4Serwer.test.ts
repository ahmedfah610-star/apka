import { describe, expect, it } from "vitest";
import { oczyscPomiar, trescZakupuGA4 } from "@/lib/ga4Serwer";

describe("oczyscPomiar", () => {
  it("bez zgody nie zapisuje identyfikatora GA ani sesji", () => {
    expect(oczyscPomiar({ zgoda: false, clientId: "123456789.1732540000", sessionId: "1732540000" })).toBeUndefined();
  });
  it("przy zgodzie zapisuje poprawne identyfikatory", () => {
    expect(oczyscPomiar({ zgoda: true, clientId: "123456789.1732540000", sessionId: "1732540000", gclid: "Cj0KCQiA_abc-123" })).toEqual({
      zgoda: true,
      clientId: "123456789.1732540000",
      sessionId: "1732540000",
      gclid: "Cj0KCQiA_abc-123",
    });
  });
  it("odrzuca śmieci i obce pola", () => {
    expect(oczyscPomiar({ zgoda: true, clientId: "<script>", sessionId: "x", inne: 1 })).toBeUndefined();
    expect(oczyscPomiar("tekst")).toBeUndefined();
  });
});

describe("trescZakupuGA4", () => {
  const zam = {
    id: "ea97098e-f79d-41d3-8b9a-ae696a1b7d3b",
    razem: 81.68,
    dostawa: 11.69,
    rabat: 0,
    pozycje: [{ id: "al-m-1ew1pdi", nazwa: "Sweter", cena: 69.99, ilosc: 1, rozmiar: "M" }],
  };
  it("zakup z tym samym transaction_id i sesją klienta", () => {
    const t = trescZakupuGA4({ ...zam, klient: { pomiar: { zgoda: true, clientId: "123456789.1732540000", sessionId: "1732540000" } } });
    expect(t?.client_id).toBe("123456789.1732540000");
    const ev = (t?.events as { name: string; params: Record<string, unknown> }[])[0];
    expect(ev.name).toBe("purchase");
    expect(ev.params.transaction_id).toBe(zam.id);
    expect(ev.params.value).toBe(81.68);
    expect(ev.params.session_id).toBe("1732540000");
  });
  it("nic nie wysyła bez zgody, bez identyfikatora albo dla zamówienia testowego", () => {
    expect(trescZakupuGA4({ ...zam, klient: {} })).toBeNull();
    expect(trescZakupuGA4({ ...zam, klient: { pomiar: { zgoda: false, gclid: "Cj0KCQiA_abc-123" } } })).toBeNull();
    expect(trescZakupuGA4({ ...zam, klient: { test: true, pomiar: { zgoda: true, clientId: "123456789.1732540000" } } })).toBeNull();
  });
});
