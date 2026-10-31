import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Każdy wysłany mail (także nieudany) trafia do dziennika z typem, adresatem i treścią.
const wpisy: { do: string; temat: string; typ: string; ok: boolean; html: string; blad?: string }[] = [];
vi.mock("@/lib/mailLog", () => ({ zapiszMail: async (w: (typeof wpisy)[number]) => void wpisy.push(w) }));

describe("dziennik maili", () => {
  beforeEach(() => {
    wpisy.length = 0;
    process.env.RESEND_API_KEY = "test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("zapisuje wysłany mail o wysyłce paczki", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ id: "re_1" }), { status: 200 }));
    const { wyslijMailWyslano } = await import("@/lib/mail");
    const r = await wyslijMailWyslano({ id: "7c41a2e9-5b1d", email: "anna@example.com", imie: "Anna", przewoznik: "inpost", numer: "620123" });
    expect(r.ok).toBe(true);
    expect(wpisy).toHaveLength(1);
    expect(wpisy[0]).toMatchObject({ do: "anna@example.com", typ: "wysylka", ok: true });
    expect(wpisy[0].temat).toContain("7c41a2e9");
    expect(wpisy[0].html).toContain("620123");
  });

  it("zapisuje też nieudaną wysyłkę z błędem", async () => {
    vi.stubGlobal("fetch", async () => new Response("zly adres", { status: 422 }));
    const { wyslijMailWyslano } = await import("@/lib/mail");
    const r = await wyslijMailWyslano({ id: "7c41a2e9-5b1d", email: "zly@", imie: "Anna" });
    expect(r.ok).toBe(false);
    expect(wpisy[0]).toMatchObject({ do: "zly@", typ: "wysylka", ok: false });
    expect(wpisy[0].blad).toContain("422");
  });
});
