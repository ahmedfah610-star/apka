import { afterEach, describe, expect, it, vi } from "vitest";
import { ladnaWielkosc, rozbijAdres, firmaPoNip } from "@/lib/rejestrVat";

// „Pobierz dane" po NIP: dane z wykazu podatników VAT, czytelne litery, błędy nie blokują zamówienia.
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rejestr VAT", () => {
  it("wielkie litery z rejestru → zwykły zapis z formą prawną", () => {
    expect(ladnaWielkosc("KWIATEK I SYN SP. Z O.O.")).toBe("Kwiatek i Syn Sp. z o.o.");
    expect(ladnaWielkosc("MINISTERSTWO FINANSÓW")).toBe("Ministerstwo Finansów");
    expect(ladnaWielkosc("ABC SPÓŁKA AKCYJNA")).toBe("Abc S.A.");
    expect(ladnaWielkosc("Firma Już Ładnie")).toBe("Firma Już Ładnie"); // nie ruszamy zapisu mieszanego
  });

  it("adres z rejestru rozbity na ulicę, kod i miasto", () => {
    expect(rozbijAdres("UL. LIPOWA 12/4, 20-001 LUBLIN")).toEqual({ adres: "ul. Lipowa 12/4", kod: "20-001", miasto: "Lublin" });
    expect(rozbijAdres("ŚWIĘTOKRZYSKA 12, 00-916 WARSZAWA")).toEqual({ adres: "Świętokrzyska 12", kod: "00-916", miasto: "Warszawa" });
    expect(rozbijAdres("BIELSKO-BIAŁA, UL. 3 MAJA 1, 43-300 BIELSKO-BIAŁA").miasto).toBe("Bielsko-Biała");
  });

  it("znaleziona firma (adres prowadzenia działalności ma pierwszeństwo)", async () => {
    let url = "";
    vi.stubGlobal("fetch", async (u: string) => {
      url = u;
      return new Response(
        JSON.stringify({ result: { subject: { name: "KWIATEK I SYN SP. Z O.O.", nip: "5260250274", statusVat: "Czynny", residenceAddress: "INNA 1, 00-001 WARSZAWA", workingAddress: "UL. LIPOWA 12/4, 20-001 LUBLIN" } } }),
        { status: 200 },
      );
    });
    const w = await firmaPoNip("526-025-02-74", new Date("2026-11-11T10:00:00Z"));
    expect(url).toBe("https://wl-api.mf.gov.pl/api/search/nip/5260250274?date=2026-11-11");
    expect(w).toEqual({ ok: true, firma: { nip: "5260250274", nazwa: "Kwiatek i Syn Sp. z o.o.", adres: "ul. Lipowa 12/4", kod: "20-001", miasto: "Lublin", statusVat: "Czynny" } });
  });

  it("zły NIP — bez zapytania; brak firmy / błąd / przeciążenie — komunikat, nie wyjątek", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await firmaPoNip("5260250275")).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();

    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ result: { subject: null } }), { status: 200 }));
    expect(await firmaPoNip("5260250274")).toMatchObject({ ok: false, blad: expect.stringMatching(/Nie znaleźliśmy/) });
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 429 }));
    expect(await firmaPoNip("5260250274")).toMatchObject({ ok: false, blad: expect.stringMatching(/przeciążony/) });
    vi.stubGlobal("fetch", async () => {
      throw new Error("timeout");
    });
    expect(await firmaPoNip("5260250274")).toMatchObject({ ok: false, blad: expect.stringMatching(/nie odpowiada/) });
  });
});
