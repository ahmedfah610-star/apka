import { beforeEach, describe, expect, it, vi } from "vitest";

// Zapis z edytora produktu nie może skasować zdjęć: lista produktów wysyła galerię jako puste
// miejsca, więc lista samych pustych adresów nie nadpisuje bazy, a puste adresy są odrzucane.
const zapisy: Record<string, unknown>[] = [];
vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => true, odmowa: () => new Response(null, { status: 401 }) }));
vi.mock("@/lib/rewalidacja", () => ({ odswiezPoZmianieStanu: () => {} }));
vi.mock("@/lib/restock", () => ({ powiadomOOdblokowaniu: async () => {} }));
vi.mock("@/lib/supabase", () => ({
  supabaseWlaczony: () => true,
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { poprawki: null }, error: null }) }) }),
      update: (m: Record<string, unknown>) => ({ eq: async () => (zapisy.push(m), { error: null }) }),
    }),
  }),
}));

async function patch(zmiany: Record<string, unknown>) {
  const { PATCH } = await import("@/app/api/admin/produkty/route");
  const res = await PATCH(new Request("https://bobas-shopping.pl/api/admin/produkty", { method: "PATCH", body: JSON.stringify({ id: "p1", zmiany }) }));
  return { status: res.status, zapis: zapisy[zapisy.length - 1] };
}

describe("edycja produktu a zdjęcia", () => {
  beforeEach(() => {
    zapisy.length = 0;
  });

  it("same puste adresy (lekka lista) nie nadpisują zdjęć", async () => {
    const { status, zapis } = await patch({ nazwa: "Bluza", zdjecia: ["", "", "", "", ""], zdjecie: "" });
    expect(status).toBe(200);
    expect(zapis).toMatchObject({ nazwa: "Bluza" });
    expect(zapis).not.toHaveProperty("zdjecia");
    expect(zapis).not.toHaveProperty("zdjecie");
  });

  it("puste adresy są odrzucane, prawdziwe zostają w kolejności", async () => {
    const { zapis } = await patch({ zdjecia: [" https://a.test/1.jpg", "", "https://a.test/2.jpg"] });
    expect(zapis).toMatchObject({ zdjecia: ["https://a.test/1.jpg", "https://a.test/2.jpg"], zdjecie: "https://a.test/1.jpg" });
  });

  it("świadome usunięcie wszystkich zdjęć (pusta lista) nadal działa", async () => {
    const { zapis } = await patch({ zdjecia: [] });
    expect(zapis).toMatchObject({ zdjecia: [], zdjecie: null });
  });

  it("zapis bez pola zdjęć (edytor bez zmian w galerii) nie rusza zdjęć", async () => {
    const { zapis } = await patch({ nazwa: "Sweter", cena: 49.99 });
    expect(zapis).not.toHaveProperty("zdjecia");
    expect(zapis).not.toHaveProperty("zdjecie");
  });
});
