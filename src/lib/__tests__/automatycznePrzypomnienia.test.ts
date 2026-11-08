import { beforeEach, describe, expect, it, vi } from "vitest";

// Automatyczne przypomnienie o niedokończonej płatności: jedno na zamówienie, tylko gdy ma sens.
const maile: { to: string; subject: string }[] = [];
const aktualizacje: { id: string; klient: Record<string, unknown> }[] = [];
let zamowienia: Record<string, unknown>[] = [];
let oplaconePozniej: string[] = [];

vi.mock("@/lib/mailLog", () => ({ zapiszMail: async () => {} }));
vi.mock("@/lib/produktyDb", () => ({
  produktyPoIdSwieze: async () => [
    { id: "p1", stanRozmiary: { "68": 2, "74": 0 }, stan: 2 },
  ],
}));

function zapytanie() {
  const f: Record<string, unknown> = {};
  const q: Record<string, unknown> = {};
  for (const m of ["select", "gte", "lte", "limit", "in"]) q[m] = () => q;
  q.eq = (k: string, v: unknown) => ((f[k] = v), q);
  q.ilike = (_k: string, v: unknown) => ((f.email = v), q);
  q.update = (z: { klient: Record<string, unknown> }) => ({ eq: async (_k: string, id: string) => (aktualizacje.push({ id, klient: z.klient }), { error: null }) });
  q.then = (ok: (v: unknown) => unknown) =>
    Promise.resolve(f.email !== undefined ? { data: oplaconePozniej.includes(String(f.email)) ? [{ id: "inne" }] : [], error: null } : { data: zamowienia, error: null }).then(ok);
  return q;
}
const sb = { from: zapytanie };

const zam = (id: string, klient: Record<string, unknown>, rozmiar = "68") => ({
  id, created_at: new Date(Date.now() - 2 * 3600000).toISOString(), status: "oczekuje_na_platnosc",
  pozycje: [{ id: "p1", nazwa: "Body", cena: 20, ilosc: 1, rozmiar }], razem: 34.6, dostawa: 14.6, rabat: 0, kod_rabatowy: null, metoda: "InPost Paczkomat 24/7 · Przelewy24",
  klient: { imie: "Anna", paczkomat: "WAW01", ...klient },
});

beforeEach(() => {
  vi.resetModules();
  maile.length = 0;
  aktualizacje.length = 0;
  oplaconePozniej = [];
  process.env.RESEND_API_KEY = "re_test";
  vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
    maile.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  });
});

describe("automatyczne przypomnienie o płatności", () => {
  it("wysyła tylko tam, gdzie trzeba, i oznacza jako wysłane automatycznie", async () => {
    zamowienia = [
      zam("ok", { email: "anna@example.com" }),
      zam("juz", { email: "b@example.com", przypomnienie: "2026-11-08T10:00:00Z" }),
      zam("test", { email: "c@example.com", test: true }),
      zam("bez-maila", {}),
      zam("kupila-inne", { email: "d@example.com" }),
      zam("wyprzedane", { email: "e@example.com" }, "74"),
    ];
    oplaconePozniej = ["d@example.com"];
    const { automatycznePrzypomnienia } = await import("@/lib/przypomnieniaPlatnosci");
    const w = await automatycznePrzypomnienia(sb as never);
    expect(w).toMatchObject({ ok: true, wyslano: 1, pominieto: 2 });
    expect(maile.map((m) => m.to)).toEqual(["anna@example.com"]);
    expect(maile[0].subject).toContain("czeka na dokończenie");
    expect(aktualizacje).toHaveLength(1);
    expect(aktualizacje[0].id).toBe("ok");
    expect(aktualizacje[0].klient).toMatchObject({ email: "anna@example.com", paczkomat: "WAW01", przypomnienieAuto: true });
    expect(typeof aktualizacje[0].klient.przypomnienie).toBe("string");
  });

  it("bez maili skonfigurowanych — nic nie robi", async () => {
    delete process.env.RESEND_API_KEY;
    zamowienia = [zam("ok", { email: "anna@example.com" })];
    const { automatycznePrzypomnienia } = await import("@/lib/przypomnieniaPlatnosci");
    expect((await automatycznePrzypomnienia(sb as never)).ok).toBe(false);
    expect(maile).toHaveLength(0);
  });
});
