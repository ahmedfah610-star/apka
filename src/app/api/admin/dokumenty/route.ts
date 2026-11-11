import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { wyslijDokument } from "@/lib/mail";
import { nazwaPlikuDokumentu, type DokumentZamowienia, type TypDokumentu } from "@/lib/faktura";
import type { DaneMailaDokumentu } from "@/lib/mailDokumentu";
import { linkDokumentuZMaila } from "@/lib/dokumentToken";
import {
  MAX_ROZMIAR_DOKUMENTU,
  typPliku,
  wgrajDokument,
  pobierzDokument,
  linkDoDokumentu,
  usunPlikDokumentu,
  zamowienieDoDokumentow,
  zapiszDokumenty,
  type ZamowienieZDokumentami,
} from "@/lib/dokumentyMagazyn";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Panel → zamówienie → „Faktura i dokumenty": wgranie dokumentu (PDF/JPG/PNG) do prywatnego
// magazynu, wysyłka mailem z załącznikiem, ponowna wysyłka, usunięcie, podgląd pliku.

const TYPY: TypDokumentu[] = ["faktura", "korekta", "dowod", "inny"];
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const ROZSZERZENIE: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const pole = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "");

/** Adresaci: wskazany e-mail (albo e-mail do faktury, albo z zamówienia) + opcjonalna kopia do klienta. */
function adresaci(z: ZamowienieZDokumentami, doWe: string, kopia: boolean): string[] | { blad: string } {
  const glowny = (doWe || z.klient.faktura?.email || z.klient.email || "").trim().toLowerCase();
  if (!EMAIL.test(glowny)) return { blad: "Podaj prawidłowy e-mail odbiorcy." };
  const lista = [glowny];
  const klienta = String(z.klient.email ?? "").trim().toLowerCase();
  if (kopia && EMAIL.test(klienta) && klienta !== glowny) lista.push(klienta);
  return lista;
}

function daneMaila(z: ZamowienieZDokumentami, d: DokumentZamowienia, dopisek: string): DaneMailaDokumentu {
  return {
    typ: d.typ,
    zamowienieId: z.id,
    dataZamowienia: z.created_at,
    razem: z.razem,
    imie: z.klient.imie,
    faktura: z.klient.faktura ?? null,
    numer: d.numer,
    ksef: d.ksef,
    nazwaDokumentu: d.nazwaDokumentu,
    dotyczy: d.dotyczy,
    przyczyna: d.przyczyna,
    kwota: d.kwota,
    nazwaPliku: d.nazwaPliku,
    dopisek,
    link: linkDokumentuZMaila(z.id, d.id),
  };
}

async function wyslijIZapisz(sbw: NonNullable<ReturnType<typeof sbService>>, z: ZamowienieZDokumentami, d: DokumentZamowienia, do_: string[], dopisek: string, tresc: Uint8Array) {
  const mail = await wyslijDokument(do_, daneMaila(z, d, dopisek), { nazwa: d.nazwaPliku, tresc });
  if (mail.ok) {
    const lista = (z.klient.dokumenty ?? []).map((x) => (x.id === d.id ? { ...x, wysylki: [...(x.wysylki ?? []), { czas: new Date().toISOString(), do: do_ }] } : x));
    await zapiszDokumenty(sbw, z, lista);
  }
  return mail;
}

// Wgranie (i opcjonalnie wysyłka) nowego dokumentu.
export async function POST(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, blad: "Nieprawidłowe żądanie." }, { status: 400 });
  const z = await zamowienieDoDokumentow(sb, String(form.get("zamowienie") ?? ""));
  if (!z) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });

  const typ = String(form.get("typ") ?? "") as TypDokumentu;
  if (!TYPY.includes(typ)) return Response.json({ ok: false, blad: "Wybierz rodzaj dokumentu." }, { status: 400 });
  const numer = pole(form.get("numer"), 60);
  if ((typ === "faktura" || typ === "korekta") && !numer) {
    return Response.json({ ok: false, blad: typ === "faktura" ? "Podaj numer faktury." : "Podaj numer korekty." }, { status: 400 });
  }

  const plik = form.get("plik");
  if (!(plik instanceof File) || plik.size === 0) return Response.json({ ok: false, blad: "Dodaj plik dokumentu." }, { status: 400 });
  if (plik.size > MAX_ROZMIAR_DOKUMENTU) return Response.json({ ok: false, blad: "Plik jest za duży (max 4 MB)." }, { status: 400 });
  const tresc = new Uint8Array(await plik.arrayBuffer());
  const mime = typPliku(tresc);
  if (!mime) return Response.json({ ok: false, blad: "Dozwolone są tylko pliki PDF, JPG i PNG." }, { status: 400 });

  const kwotaTekst = pole(form.get("kwota"), 20).replace(",", ".").replace(/\s/g, "");
  const kwota = kwotaTekst ? Number(kwotaTekst) : undefined;
  if (kwota !== undefined && (!Number.isFinite(kwota) || Math.abs(kwota) > 100000)) {
    return Response.json({ ok: false, blad: "Kwota korekty jest nieprawidłowa." }, { status: 400 });
  }

  const wyslij = form.get("wyslij") === "1";
  let do_: string[] = [];
  if (wyslij) {
    const a = adresaci(z, pole(form.get("do"), 160), form.get("kopia") === "1");
    if ("blad" in a) return Response.json({ ok: false, blad: a.blad }, { status: 400 });
    do_ = a;
  }

  const czas = new Date().toISOString();
  const rozsz = ROZSZERZENIE[mime];
  const nazwaPliku = nazwaPlikuDokumentu(typ, numer, z.id, rozsz);
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const sciezka = `${z.id}/${id}-${nazwaPliku}`;

  const wg = await wgrajDokument(sb, sciezka, tresc, mime);
  if (!wg.ok) return Response.json({ ok: false, blad: `Nie udało się zapisać pliku: ${wg.blad}` }, { status: 500 });

  const dokument: DokumentZamowienia = {
    id,
    typ,
    ...(numer ? { numer } : {}),
    ...(pole(form.get("ksef"), 80) ? { ksef: pole(form.get("ksef"), 80) } : {}),
    ...(typ === "inny" && pole(form.get("nazwaDokumentu"), 80) ? { nazwaDokumentu: pole(form.get("nazwaDokumentu"), 80) } : {}),
    ...(typ === "korekta" && pole(form.get("dotyczy"), 60) ? { dotyczy: pole(form.get("dotyczy"), 60) } : {}),
    ...(typ === "korekta" && pole(form.get("przyczyna"), 160) ? { przyczyna: pole(form.get("przyczyna"), 160) } : {}),
    ...(typ === "korekta" && kwota !== undefined ? { kwota: Math.round(kwota * 100) / 100 } : {}),
    plik: sciezka,
    nazwaPliku,
    rozmiar: tresc.length,
    mime,
    czas,
    wysylki: [],
  };
  const zapis = await zapiszDokumenty(sb, z, [...(z.klient.dokumenty ?? []), dokument]);
  if (!zapis.ok) {
    await usunPlikDokumentu(sb, sciezka);
    return Response.json({ ok: false, blad: `Nie udało się zapisać dokumentu: ${zapis.blad}` }, { status: 500 });
  }

  let mail: { ok: boolean; blad?: string } | undefined;
  if (wyslij) mail = await wyslijIZapisz(sb, z, dokument, do_, pole(form.get("dopisek"), 1000), tresc);
  return Response.json({ ok: true, dokumenty: z.klient.dokumenty, mail });
}

// Ponowna wysyłka zapisanego dokumentu.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const z = await zamowienieDoDokumentow(sb, String(b.zamowienie ?? ""));
  if (!z) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });
  const d = (z.klient.dokumenty ?? []).find((x) => x.id === b.dokument);
  if (!d) return Response.json({ ok: false, blad: "Nie znaleziono dokumentu." }, { status: 404 });
  const a = adresaci(z, pole(b.do, 160), b.kopia === true);
  if ("blad" in a) return Response.json({ ok: false, blad: a.blad }, { status: 400 });
  const tresc = await pobierzDokument(sb, d.plik);
  if (!tresc) return Response.json({ ok: false, blad: "Nie udało się odczytać pliku." }, { status: 500 });
  const mail = await wyslijIZapisz(sb, z, d, a, pole(b.dopisek, 1000), tresc);
  if (!mail.ok) return Response.json({ ok: false, blad: mail.blad || "Nie udało się wysłać maila." }, { status: 502 });
  return Response.json({ ok: true, dokumenty: z.klient.dokumenty });
}

// Usunięcie dokumentu (plik + wpis).
export async function DELETE(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const z = await zamowienieDoDokumentow(sb, String(b.zamowienie ?? ""));
  if (!z) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });
  const d = (z.klient.dokumenty ?? []).find((x) => x.id === b.dokument);
  if (!d) return Response.json({ ok: false, blad: "Nie znaleziono dokumentu." }, { status: 404 });
  const zapis = await zapiszDokumenty(sb, z, (z.klient.dokumenty ?? []).filter((x) => x.id !== d.id));
  if (!zapis.ok) return Response.json({ ok: false, blad: zapis.blad }, { status: 500 });
  await usunPlikDokumentu(sb, d.plik);
  return Response.json({ ok: true, dokumenty: z.klient.dokumenty });
}

// Podgląd pliku (krótko ważny link).
export async function GET(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const u = new URL(req.url);
  const z = await zamowienieDoDokumentow(sb, u.searchParams.get("zamowienie") ?? "");
  const d = z?.klient.dokumenty?.find((x) => x.id === u.searchParams.get("dokument"));
  if (!z || !d) return Response.json({ ok: false, blad: "Nie znaleziono dokumentu." }, { status: 404 });
  const link = await linkDoDokumentu(sb, d);
  if (!link) return Response.json({ ok: false, blad: "Nie udało się otworzyć pliku." }, { status: 500 });
  return Response.redirect(link, 302);
}
