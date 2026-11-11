import { beforeEach, describe, expect, it, vi } from "vitest";

// Dokumenty do zamówienia: szablony maili, wgranie do prywatnego magazynu, wysyłka z załącznikiem,
// ponowna wysyłka, usuwanie, pobranie przez klienta. Dostęp tylko dla admina / właściciela zamówienia.
const ID = "31d013de-5b1d-4e2a-9f3c-0d8e6a1b2c3d";
let admin = true;
let zamowienie: Record<string, unknown> | null;
const aktualizacje: Record<string, unknown>[] = [];
const wgrane: { sciezka: string; mime: string; rozmiar: number }[] = [];
const usuniete: string[] = [];
const maile: { to: string[]; subject: string; html: string; reply_to?: string; attachments?: { filename: string; content: string }[] }[] = [];
let resendOk = true;
let uzytkownik: { email: string } | null = null;

vi.mock("@/lib/adminAuth", () => ({ czyAdmin: () => admin, odmowa: () => Response.json({ ok: false }, { status: 401 }) }));
vi.mock("@/lib/mailLog", () => ({ zapiszMail: async () => {} }));
vi.mock("@/lib/supabase", () => ({
  sbService: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: zamowienie }) }) }),
      update: (w: Record<string, unknown>) => ({
        eq: async () => {
          aktualizacje.push(w);
          if (zamowienie && w.klient) zamowienie = { ...zamowienie, klient: w.klient };
          return { error: null };
        },
      }),
    }),
    storage: {
      from: () => ({
        upload: async (sciezka: string, tresc: Uint8Array, o: { contentType: string }) => (wgrane.push({ sciezka, mime: o.contentType, rozmiar: tresc.length }), { error: null }),
        download: async () => ({ data: new Blob([PDF]), error: null }),
        createSignedUrl: async (sciezka: string) => ({ data: { signedUrl: `https://pliki.test/${sciezka}?token=x` }, error: null }),
        remove: async (s: string[]) => (usuniete.push(...s), { error: null }),
      }),
      createBucket: async () => ({ error: null }),
    },
    auth: { getUser: async () => ({ data: { user: uzytkownik } }) },
  }),
}));

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46]);
const FAKTURA = { typ: "firma", nip: "5260250274", nazwa: "Kwiatek i Syn Sp. z o.o.", adres: "ul. Lipowa 12/4", kod: "20-001", miasto: "Lublin", kraj: "PL", email: "ksiegowosc@kwiatek.pl" };

beforeEach(() => {
  vi.resetModules();
  admin = true;
  resendOk = true;
  uzytkownik = null;
  aktualizacje.length = 0;
  wgrane.length = 0;
  usuniete.length = 0;
  maile.length = 0;
  zamowienie = { id: ID, created_at: "2026-11-10T09:12:00Z", status: "oplacone", razem: 119.6, klient: { imie: "Anna Kwiatek", email: "anna@kwiatek.pl", paczkomat: "WAW123M", faktura: FAKTURA } };
  process.env.RESEND_API_KEY = "re_test";
  vi.stubGlobal("fetch", async (_u: string, init: { body: string }) => {
    maile.push(JSON.parse(init.body));
    return resendOk ? new Response(JSON.stringify({ id: "m1" }), { status: 200 }) : new Response("limit", { status: 429 });
  });
});

function formularz(pola: Record<string, string>, plik: Uint8Array | null = PDF, nazwa = "FV 12-11-2026.pdf") {
  const fd = new FormData();
  fd.set("zamowienie", ID);
  for (const [k, v] of Object.entries(pola)) fd.set(k, v);
  if (plik) fd.set("plik", new File([plik], nazwa, { type: "application/pdf" }));
  return new Request("https://x/api/admin/dokumenty", { method: "POST", body: fd });
}

describe("szablony maili z dokumentem", () => {
  it("faktura, korekta, dowód zakupu — temat i treść zależne od typu", async () => {
    const { mailDokumentuHtml, tematDokumentu } = await import("@/lib/mailDokumentu");
    const baza = { zamowienieId: ID, dataZamowienia: "2026-11-10T09:12:00Z", razem: 119.6, imie: "Anna Kwiatek", faktura: FAKTURA as never, nazwaPliku: "Faktura_FV_12.pdf" };
    expect(tematDokumentu({ ...baza, typ: "faktura", numer: "FV 12/11/2026" })).toBe("Faktura FV 12/11/2026 do zamówienia #31d013de — bobas-shopping");
    const fv = mailDokumentuHtml({ ...baza, typ: "faktura", numer: "FV 12/11/2026", ksef: "5260250274-20261111-AB" });
    expect(fv).toContain("Faktura do Twojego zamówienia");
    expect(fv).toContain("Cześć Anna!");
    expect(fv).toContain("FV 12/11/2026");
    expect(fv).toContain("NIP 526-025-02-74");
    expect(fv).toContain("119,60 zł");
    expect(fv).toContain("KSeF");
    expect(fv).toContain("Faktura_FV_12.pdf");

    expect(tematDokumentu({ ...baza, typ: "korekta", numer: "FK 2", dotyczy: "FV 12/11/2026" })).toBe("Korekta faktury FV 12/11/2026 — zamówienie #31d013de — bobas-shopping");
    const fk = mailDokumentuHtml({ ...baza, typ: "korekta", numer: "FK 2", dotyczy: "FV 12/11/2026", przyczyna: "Zwrot towaru", kwota: -39.99 });
    expect(fk).toContain("Faktura korygująca");
    expect(fk).toContain("Zwrot towaru");
    expect(fk).toContain("−39,99 zł");

    expect(tematDokumentu({ ...baza, typ: "dowod" })).toBe("Dowód zakupu — zamówienie #31d013de — bobas-shopping");
    expect(mailDokumentuHtml({ ...baza, typ: "dowod" })).toContain("przy zwrocie lub reklamacji");
    expect(tematDokumentu({ ...baza, typ: "inny", nazwaDokumentu: "Duplikat faktury" })).toBe("Duplikat faktury — zamówienie #31d013de — bobas-shopping");
  });

  it("dopisek i dane z bazy są escapowane", async () => {
    const { mailDokumentuHtml } = await import("@/lib/mailDokumentu");
    const h = mailDokumentuHtml({ typ: "inny", zamowienieId: ID, dataZamowienia: "2026-11-10T09:12:00Z", razem: 1, nazwaPliku: "x.pdf", dopisek: "<script>alert(1)</script>", nazwaDokumentu: "<b>X</b>" });
    expect(h).not.toContain("<script>alert(1)</script>");
    expect(h).not.toContain("<b>X</b>");
  });
});

describe("panel: wgranie i wysyłka dokumentu", () => {
  it("tylko admin", async () => {
    admin = false;
    const { POST, PATCH, DELETE, GET } = await import("@/app/api/admin/dokumenty/route");
    expect((await POST(formularz({ typ: "faktura", numer: "FV 1" }))).status).toBe(401);
    expect((await PATCH(new Request("https://x", { method: "PATCH", body: "{}" }))).status).toBe(401);
    expect((await DELETE(new Request("https://x", { method: "DELETE", body: "{}" }))).status).toBe(401);
    expect((await GET(new Request("https://x/?zamowienie=" + ID))).status).toBe(401);
    expect(wgrane).toHaveLength(0);
  });

  it("odrzuca plik, który nie jest PDF/JPG/PNG (po zawartości, nie po nazwie) i fakturę bez numeru", async () => {
    const { POST } = await import("@/app/api/admin/dokumenty/route");
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    const r1 = await POST(formularz({ typ: "dowod" }, exe, "faktura.pdf"));
    expect(r1.status).toBe(400);
    expect(((await r1.json()) as { blad: string }).blad).toMatch(/PDF, JPG i PNG/);
    expect((await POST(formularz({ typ: "faktura", numer: "" }))).status).toBe(400);
    expect((await POST(formularz({ typ: "faktura", numer: "FV 1" }, null))).status).toBe(400);
    expect(wgrane).toHaveLength(0);
  });

  it("wgranie + wysyłka: plik w prywatnym magazynie, wpis w zamówieniu, mail z załącznikiem do księgowości + kopia do klienta", async () => {
    const { POST } = await import("@/app/api/admin/dokumenty/route");
    const r = await POST(formularz({ typ: "faktura", numer: "FV 12/11/2026", ksef: "5260250274-20261111-AB", wyslij: "1", do: "", kopia: "1", dopisek: "Dziękujemy!" }));
    const d = (await r.json()) as { ok: boolean; mail: { ok: boolean }; dokumenty: { typ: string; numer: string; plik: string; nazwaPliku: string; wysylki: { do: string[] }[] }[] };
    expect(r.status).toBe(200);
    expect(d.ok).toBe(true);
    expect(d.mail.ok).toBe(true);
    expect(wgrane[0].sciezka.startsWith(`${ID}/`)).toBe(true);
    expect(wgrane[0].mime).toBe("application/pdf");
    expect(d.dokumenty[0]).toMatchObject({ typ: "faktura", numer: "FV 12/11/2026", nazwaPliku: "Faktura_FV_12_11_2026.pdf" });
    expect(d.dokumenty[0].wysylki[0].do).toEqual(["ksiegowosc@kwiatek.pl", "anna@kwiatek.pl"]);
    expect(maile[0].to).toEqual(["ksiegowosc@kwiatek.pl", "anna@kwiatek.pl"]);
    expect(maile[0].subject).toBe("Faktura FV 12/11/2026 do zamówienia #31d013de — bobas-shopping");
    expect(maile[0].reply_to).toBe("amin.kids1@hotmail.com");
    expect(maile[0].attachments?.[0].filename).toBe("Faktura_FV_12_11_2026.pdf");
    expect(Buffer.from(maile[0].attachments![0].content, "base64")).toEqual(Buffer.from(PDF));
    expect(maile[0].html).toContain("Dziękujemy!");
    // Reszta danych klienta nietknięta.
    const k = (zamowienie!.klient as Record<string, unknown>);
    expect(k.paczkomat).toBe("WAW123M");
    expect(k.faktura).toEqual(FAKTURA);
  });

  it("tylko zapisz — bez maila; mail nieudany — dokument i tak zapisany", async () => {
    const { POST } = await import("@/app/api/admin/dokumenty/route");
    const r1 = await POST(formularz({ typ: "dowod", wyslij: "0" }));
    expect(((await r1.json()) as { ok: boolean }).ok).toBe(true);
    expect(maile).toHaveLength(0);
    resendOk = false;
    const r2 = await POST(formularz({ typ: "faktura", numer: "FV 2", wyslij: "1" }));
    const d2 = (await r2.json()) as { ok: boolean; mail: { ok: boolean }; dokumenty: { wysylki: unknown[] }[] };
    expect(d2.ok).toBe(true);
    expect(d2.mail.ok).toBe(false);
    expect(d2.dokumenty).toHaveLength(2);
    expect(d2.dokumenty[1].wysylki).toHaveLength(0);
  });

  it("ponowna wysyłka, podgląd i usunięcie", async () => {
    const { POST, PATCH, GET, DELETE } = await import("@/app/api/admin/dokumenty/route");
    const d = (await (await POST(formularz({ typ: "dowod", wyslij: "0" }))).json()) as { dokumenty: { id: string; plik: string }[] };
    const dok = d.dokumenty[0];

    const r = await PATCH(new Request("https://x", { method: "PATCH", body: JSON.stringify({ zamowienie: ID, dokument: dok.id, do: "anna@kwiatek.pl" }) }));
    expect(r.status).toBe(200);
    expect(maile[0].to).toEqual(["anna@kwiatek.pl"]);
    expect(maile[0].subject).toContain("Dowód zakupu");
    expect(((zamowienie!.klient as { dokumenty: { wysylki: unknown[] }[] }).dokumenty[0].wysylki)).toHaveLength(1);

    const g = await GET(new Request(`https://x/api/admin/dokumenty?zamowienie=${ID}&dokument=${dok.id}`));
    expect(g.status).toBe(302);
    expect(g.headers.get("location")).toContain(dok.plik);

    const u = await DELETE(new Request("https://x", { method: "DELETE", body: JSON.stringify({ zamowienie: ID, dokument: dok.id }) }));
    expect(u.status).toBe(200);
    expect(usuniete).toEqual([dok.plik]);
    expect((zamowienie!.klient as { dokumenty: unknown[] }).dokumenty).toHaveLength(0);
  });
});

describe("klient: pobranie dokumentu z konta", () => {
  async function pobierz(token: string | null, dokument: string) {
    const { GET } = await import("@/app/api/konto/dokument/route");
    const h: Record<string, string> = { "x-forwarded-for": "10.9.9.9" };
    if (token) h.authorization = `Bearer ${token}`;
    return GET(new Request(`https://x/api/konto/dokument?zamowienie=${ID}&dokument=${dokument}`, { headers: h }));
  }
  it("tylko zalogowany właściciel zamówienia dostaje link", async () => {
    zamowienie = { ...zamowienie!, klient: { ...(zamowienie!.klient as object), dokumenty: [{ id: "d1", typ: "faktura", plik: `${ID}/d1-Faktura.pdf`, nazwaPliku: "Faktura.pdf" }] } };
    expect((await pobierz(null, "d1")).status).toBe(401);
    uzytkownik = { email: "ktos.inny@example.com" };
    expect((await pobierz("t", "d1")).status).toBe(404);
    uzytkownik = { email: "ANNA@kwiatek.pl" };
    const r = await pobierz("t", "d1");
    expect(r.status).toBe(200);
    expect(((await r.json()) as { url: string }).url).toContain(`${ID}/d1-Faktura.pdf`);
    expect((await pobierz("t", "nie-ma")).status).toBe(404);
  });
});

describe("mail: link „Otwórz dokument”", () => {
  it("mail z panelu ma klikalną ramkę z podpisanym linkiem, który otwiera plik", async () => {
    const { mailDokumentuHtml } = await import("@/lib/mailDokumentu");
    const { linkDokumentuZMaila } = await import("@/lib/dokumentToken");
    const link = linkDokumentuZMaila(ID, "d1");
    const h = mailDokumentuHtml({ typ: "faktura", zamowienieId: ID, dataZamowienia: "2026-11-10T09:12:00Z", razem: 1, nazwaPliku: "Faktura.pdf", link });
    expect(h).toContain("Otwórz dokument");
    expect(h).toContain(link.replace(/&/g, "&amp;"));

    zamowienie = { ...zamowienie!, klient: { ...(zamowienie!.klient as object), dokumenty: [{ id: "d1", typ: "faktura", plik: `${ID}/d1.pdf`, nazwaPliku: "Faktura_FV 1.pdf", mime: "application/pdf" }] } };
    const { GET } = await import("@/app/api/dokument/route");
    const r = await GET(new Request(link, { headers: { "x-forwarded-for": "10.8.8.8" } }));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("content-disposition")).toBe('inline; filename="Faktura_FV_1.pdf"');
    expect(new Uint8Array(await r.arrayBuffer())).toEqual(PDF);
  });

  it("zły podpis albo usunięty dokument → strona z wyjaśnieniem, bez pliku", async () => {
    const { GET } = await import("@/app/api/dokument/route");
    const { linkDokumentuZMaila } = await import("@/lib/dokumentToken");
    const zly = await GET(new Request(`https://x/api/dokument?z=${ID}&d=d1&t=${"0".repeat(32)}`, { headers: { "x-forwarded-for": "10.8.8.9" } }));
    expect(zly.status).toBe(404);
    expect(zly.headers.get("content-type")).toContain("text/html");
    const brak = await GET(new Request(linkDokumentuZMaila(ID, "usuniety"), { headers: { "x-forwarded-for": "10.8.8.9" } }));
    expect(brak.status).toBe(404);
    expect(await brak.text()).toContain("Dokument niedostępny");
  });
});

describe("panel: dane do faktury po zakupie", () => {
  it("dodanie, walidacja, usunięcie — reszta danych bez zmian", async () => {
    const { PATCH } = await import("@/app/api/admin/faktura/route");
    const zle = await PATCH(new Request("https://x", { method: "PATCH", body: JSON.stringify({ zamowienie: ID, faktura: { ...FAKTURA, nip: "123" } }) }));
    expect(zle.status).toBe(400);
    const ok = await PATCH(new Request("https://x", { method: "PATCH", body: JSON.stringify({ zamowienie: ID, faktura: { typ: "osoba", nazwa: "Anna Kwiatek", adres: "Polna 1", kod: "00001", miasto: "Warszawa" } }) }));
    expect(ok.status).toBe(200);
    expect((zamowienie!.klient as { faktura: { kod: string } }).faktura.kod).toBe("00-001");
    await PATCH(new Request("https://x", { method: "PATCH", body: JSON.stringify({ zamowienie: ID, faktura: null }) }));
    expect((zamowienie!.klient as Record<string, unknown>).faktura).toBeUndefined();
    expect((zamowienie!.klient as Record<string, unknown>).paczkomat).toBe("WAW123M");
  });
});
