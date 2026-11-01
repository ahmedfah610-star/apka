import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Token Allegro: refresh token jest jednorazowy. Odmowa → stan "wygaslo" (panel pokazuje „Połącz ponownie”),
// a równoległe odświeżenie przez inny proces nie może zerwać połączenia.
type Wiersz = { access_token?: string; refresh_token?: string; expires_at?: string } | null;
let auth: Wiersz = null;
const ustawienia = new Map<string, unknown>();
let odczyty = 0;
let poPierwszymOdczycie: Wiersz | undefined;

vi.mock("@/lib/supabase", () => ({
  sbService: () => ({
    from: (t: string) => ({
      select: () => ({
        eq: (_k: string, v: string) => ({
          maybeSingle: async () => {
            if (t === "allegro_auth") {
              odczyty++;
              if (odczyty === 2 && poPierwszymOdczycie !== undefined) auth = poPierwszymOdczycie;
              return { data: auth };
            }
            return { data: ustawienia.has(v) ? { wartosc: ustawienia.get(v) } : null };
          },
        }),
      }),
      upsert: async (w: Record<string, unknown>) => {
        if (t === "allegro_auth") auth = w as Wiersz;
        else ustawienia.set(String(w.klucz), w.wartosc);
        return { error: null };
      },
      delete: () => ({ eq: async (_k: string, v: string) => { ustawienia.delete(v); return { error: null }; } }),
    }),
  }),
}));

const przeszlosc = new Date(Date.now() - 1000).toISOString();

describe("token Allegro", () => {
  beforeEach(() => {
    process.env.ALLEGRO_CLIENT_ID = "id";
    process.env.ALLEGRO_CLIENT_SECRET = "sekret";
    auth = null;
    ustawienia.clear();
    odczyty = 0;
    poPierwszymOdczycie = undefined;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("odświeża i zapisuje nową parę tokenów", async () => {
    auth = { access_token: "a1", refresh_token: "r1", expires_at: przeszlosc };
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ access_token: "a2", refresh_token: "r2", expires_in: 43199 }), { status: 200 }));
    const { aktualnyToken } = await import("@/lib/allegro");
    expect(await aktualnyToken()).toBe("a2");
    expect(auth?.refresh_token).toBe("r2");
  });

  it("odmowa Allegro → wygasło, z powodem dla panelu", async () => {
    auth = { access_token: "a1", refresh_token: "r1", expires_at: przeszlosc };
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: "invalid_grant", error_description: "Invalid refresh token" }), { status: 400 }));
    const { stanPolaczenia } = await import("@/lib/allegro");
    const s = await stanPolaczenia();
    expect(s.stan).toBe("wygaslo");
    expect(s.blad).toMatch(/Invalid refresh token/);
  });

  it("brak zapisanego tokenu → brak (zwykłe „Połącz z Allegro”)", async () => {
    const { stanPolaczenia } = await import("@/lib/allegro");
    expect((await stanPolaczenia()).stan).toBe("brak");
  });

  it("inny proces zdążył odświeżyć — używamy jego tokenu zamiast zrywać połączenie", async () => {
    auth = { access_token: "a1", refresh_token: "r1", expires_at: przeszlosc };
    poPierwszymOdczycie = undefined;
    const swiezy = { access_token: "a2", refresh_token: "r2", expires_at: new Date(Date.now() + 3600e3).toISOString() };
    vi.stubGlobal("fetch", async () => {
      auth = swiezy; // równoległa synchronizacja zapisała nową parę, nasz stary r1 już nie działa
      return new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 });
    });
    const { aktualnyToken } = await import("@/lib/allegro");
    expect(await aktualnyToken()).toBe("a2");
    expect(ustawienia.size).toBe(0);
  });
});
