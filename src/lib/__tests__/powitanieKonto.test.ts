import { beforeEach, describe, expect, it, vi } from "vitest";

// Mail powitalny: tylko zalogowane, świeże konto, adres z konta (nie z żądania), raz.
const wyslane: string[] = [];
const ustawienia = new Set<string>();
let uzytkownik: { id: string; email: string; created_at: string; user_metadata?: Record<string, unknown> } | null = null;

vi.mock("@/lib/mail", () => ({ wyslijMailRejestracja: async (email: string) => void wyslane.push(email) }));
vi.mock("@/lib/supabase", () => ({
  sbService: () => ({
    auth: { getUser: async () => ({ data: { user: uzytkownik } }) },
    from: () => ({
      insert: async (w: { klucz: string }) => {
        if (ustawienia.has(w.klucz)) return { error: { message: "duplicate key" } };
        ustawienia.add(w.klucz);
        return { error: null };
      },
    }),
  }),
}));

let nr = 0;
async function wywolaj(naglowki: Record<string, string>, body: unknown = {}) {
  const { POST } = await import("@/app/api/konto/powitanie/route");
  const res = await POST(new Request("https://x/api/konto/powitanie", { method: "POST", headers: { "x-forwarded-for": `10.7.0.${++nr}`, ...naglowki }, body: JSON.stringify(body) }));
  return res.status;
}

describe("mail powitalny po założeniu konta", () => {
  beforeEach(() => {
    wyslane.length = 0;
    ustawienia.clear();
    uzytkownik = { id: "u1", email: "nowy@example.com", created_at: new Date().toISOString(), user_metadata: { imie: "Ola" } };
  });

  it("bez sesji — odmowa, nawet z adresem w treści żądania", async () => {
    expect(await wywolaj({}, { email: "ofiara@example.com" })).toBe(401);
    expect(wyslane).toEqual([]);
  });

  it("z sesją — mail na adres KONTA (adres z żądania ignorowany), tylko raz", async () => {
    expect(await wywolaj({ authorization: "Bearer t" }, { email: "ofiara@example.com" })).toBe(200);
    await wywolaj({ authorization: "Bearer t" });
    expect(wyslane).toEqual(["nowy@example.com"]);
  });

  it("stare konto — bez maila", async () => {
    uzytkownik!.created_at = new Date(Date.now() - 3 * 86400e3).toISOString();
    await wywolaj({ authorization: "Bearer t" });
    expect(wyslane).toEqual([]);
  });
});
