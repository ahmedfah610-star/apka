import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dataResend, listaZResend, mailZResend, typZTematu } from "@/lib/resendHistoria";

const wpis = (id: string, subject: string, last_event = "delivered") => ({
  id,
  to: ["anna@example.com"],
  from: "bobas-shopping <sklep@bobas-shopping.pl>",
  subject,
  created_at: "2026-10-20 10:15:00.123+00",
  last_event,
});

describe("historia maili z Resend", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("czyta daty w formacie Resend", () => {
    expect(dataResend("2023-04-03 22:13:42.674981+00")).toBe("2023-04-03T22:13:42.674Z");
    expect(dataResend("2026-10-20T10:15:00Z")).toBe("2026-10-20T10:15:00.000Z");
    expect(dataResend("bzdura")).toBe("1970-01-01T00:00:00.000Z");
  });

  it("rozpoznaje rodzaj maila po temacie", () => {
    expect(typZTematu("Potwierdzenie zamówienia 7c41a2e9 — bobas-shopping")).toBe("zamowienie");
    expect(typZTematu("[TEST] Nowe zamówienie 7c41a2e9 — 90,48 zł")).toBe("sklep");
    expect(typZTematu("Zamówienie 7c41a2e9 zostało wysłane 📦 — bobas-shopping")).toBe("wysylka");
    expect(typZTematu("Jak oceniasz swoje zakupy? — bobas-shopping ⭐")).toBe("opinia");
    expect(typZTematu("Nowości tygodnia w bobas-shopping")).toBe("newsletter");
  });

  it("pobiera wszystkie strony listy, status z ostatniego zdarzenia", async () => {
    const adresy: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      adresy.push(url);
      const druga = url.includes("after=");
      return new Response(
        JSON.stringify(
          druga
            ? { object: "list", has_more: false, data: [wpis("c3", "Jak oceniasz swoje zakupy?", "bounced")] }
            : { object: "list", has_more: true, data: [wpis("a1", "Potwierdzenie zamówienia 1"), wpis("b2", "Zamówienie 1 zostało wysłane", "opened")] },
        ),
        { status: 200 },
      );
    });
    const r = await listaZResend();
    expect(r.blad).toBeUndefined();
    expect(r.items.map((m) => m.idResend)).toEqual(["a1", "b2", "c3"]);
    expect(adresy[1]).toContain("after=b2");
    expect(r.items[0]).toMatchObject({ id: "resend:a1", do: "anna@example.com", typ: "zamowienie", ok: true, zdarzenie: "delivered" });
    expect(r.items[2]).toMatchObject({ typ: "opinia", ok: false, zdarzenie: "bounced" });
    expect(r.items[0].czas).toBe("2026-10-20T10:15:00.123Z");
  });

  it("klucz tylko do wysyłki — czytelny komunikat zamiast listy", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ statusCode: 401, name: "restricted_api_key", message: "This API key is restricted to only send emails" }), { status: 401 }));
    const r = await listaZResend();
    expect(r.items).toHaveLength(0);
    expect(r.blad).toMatch(/Full access/);
  });

  it("treść jednego maila", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ ...wpis("a1b2c3d4-e5f6", "Potwierdzenie zamówienia 1"), html: "<p>Dziękujemy</p>" }), { status: 200 }));
    const r = await mailZResend("a1b2c3d4-e5f6");
    expect(r.mail?.html).toBe("<p>Dziękujemy</p>");
    expect((await mailZResend("../zle")).blad).toBeTruthy();
  });
});
