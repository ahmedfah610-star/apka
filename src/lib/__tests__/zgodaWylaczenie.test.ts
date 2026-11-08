import { beforeEach, describe, expect, it, vi } from "vitest";

// Wyłączenie zgody na kody i nowości linkiem z maila: tylko z poprawnym podpisem, GET tylko pyta
// (skanery poczty otwierają linki), POST wyłącza i zachowuje resztę danych konta.
const aktualizacje: { id: string; meta: Record<string, unknown> }[] = [];
let meta: Record<string, unknown> = {};
vi.mock("@/lib/supabase", () => ({
  sbService: () => ({
    auth: {
      admin: {
        getUserById: async (id: string) => ({ data: { user: { id, user_metadata: meta } }, error: null }),
        updateUserById: async (id: string, z: { user_metadata: Record<string, unknown> }) => (aktualizacje.push({ id, meta: z.user_metadata }), { error: null }),
      },
    },
  }),
}));

beforeEach(() => {
  vi.resetModules();
  aktualizacje.length = 0;
  meta = { imie: "Tomasz", telefon: "600100200", zgoda_marketing: true };
});

async function link(u = "u-tomasz") {
  const { linkWylaczeniaZgody } = await import("@/lib/zgodaToken");
  return linkWylaczeniaZgody(u).replace("https://bobas-shopping.pl", "https://x");
}

describe("wyłączenie zgody z linku w mailu", () => {
  it("GET tylko pokazuje pytanie — nic nie zmienia", async () => {
    const { GET } = await import("@/app/api/konto/zgoda/route");
    const html = await (await GET(new Request(await link()))).text();
    expect(html).toContain("TAK, WYŁĄCZ");
    expect(aktualizacje).toHaveLength(0);
  });

  it("POST wyłącza zgodę i zostawia resztę danych konta", async () => {
    const { POST } = await import("@/app/api/konto/zgoda/route");
    const html = await (await POST(new Request(await link(), { method: "POST" }))).text();
    expect(html).toContain("zgoda wyłączona");
    expect(aktualizacje[0].id).toBe("u-tomasz");
    expect(aktualizacje[0].meta).toMatchObject({ imie: "Tomasz", telefon: "600100200", zgoda_marketing: false });
    expect(typeof aktualizacje[0].meta.zgoda_marketing_wycofana).toBe("string");
  });

  it("zły podpis albo cudze konto — odmowa", async () => {
    const { POST } = await import("@/app/api/konto/zgoda/route");
    const cudzy = (await link("u-tomasz")).replace("u=u-tomasz", "u=u-ktos-inny");
    expect(await (await POST(new Request(cudzy, { method: "POST" }))).text()).toContain("Nieprawidłowy link");
    expect(await (await POST(new Request("https://x/api/konto/zgoda?u=u-tomasz&t=abc", { method: "POST" }))).text()).toContain("Nieprawidłowy link");
    expect(aktualizacje).toHaveLength(0);
  });
});
