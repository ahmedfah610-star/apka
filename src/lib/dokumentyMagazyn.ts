import type { SupabaseClient } from "@supabase/supabase-js";
import type { DaneFaktury, DokumentZamowienia } from "@/lib/faktura";

// Prywatny magazyn plików na dokumenty do zamówień (faktury, korekty, dowody zakupu).
// Bucket NIE jest publiczny: plik da się pobrać tylko przez krótko ważny, podpisany link
// wydany adminowi albo zalogowanemu klientowi, do którego należy zamówienie.

export const BUCKET_DOKUMENTOW = "dokumenty";
export const MAX_ROZMIAR_DOKUMENTU = 4 * 1024 * 1024; // limit treści żądania na Vercelu to ~4,5 MB

/** Typ pliku po pierwszych bajtach (nie po nazwie ani nagłówku z przeglądarki). */
export function typPliku(b: Uint8Array): "application/pdf" | "image/jpeg" | "image/png" | null {
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf"; // %PDF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  return null;
}

/** Wgranie pliku; przy pierwszym użyciu zakłada prywatny bucket. */
export async function wgrajDokument(sb: SupabaseClient, sciezka: string, tresc: Uint8Array, mime: string): Promise<{ ok: boolean; blad?: string }> {
  const wgraj = () => sb.storage.from(BUCKET_DOKUMENTOW).upload(sciezka, tresc, { contentType: mime, upsert: false });
  let { error } = await wgraj();
  if (error && /not.?found|does not exist/i.test(error.message)) {
    await sb.storage.createBucket(BUCKET_DOKUMENTOW, { public: false, fileSizeLimit: MAX_ROZMIAR_DOKUMENTU });
    ({ error } = await wgraj());
  }
  return error ? { ok: false, blad: error.message } : { ok: true };
}

export async function pobierzDokument(sb: SupabaseClient, sciezka: string): Promise<Uint8Array | null> {
  const { data, error } = await sb.storage.from(BUCKET_DOKUMENTOW).download(sciezka);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/** Link do pobrania ważny 2 minuty, z nazwą pliku dla przeglądarki. */
export async function linkDoDokumentu(sb: SupabaseClient, d: Pick<DokumentZamowienia, "plik" | "nazwaPliku">): Promise<string | null> {
  const { data, error } = await sb.storage.from(BUCKET_DOKUMENTOW).createSignedUrl(d.plik, 120, { download: d.nazwaPliku });
  return error || !data?.signedUrl ? null : data.signedUrl;
}

export async function usunPlikDokumentu(sb: SupabaseClient, sciezka: string): Promise<void> {
  await sb.storage.from(BUCKET_DOKUMENTOW).remove([sciezka]);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ZamowienieZDokumentami {
  id: string;
  created_at: string;
  status: string;
  razem: number;
  klient: Record<string, any> & { email?: string; imie?: string; faktura?: DaneFaktury | null; dokumenty?: DokumentZamowienia[] };
}

export async function zamowienieDoDokumentow(sb: SupabaseClient, id: string): Promise<ZamowienieZDokumentami | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from("zamowienia").select("id, created_at, status, razem, klient").eq("id", id).maybeSingle();
  if (!data) return null;
  return { ...(data as any), razem: Number((data as any).razem), klient: ((data as any).klient ?? {}) as ZamowienieZDokumentami["klient"] };
}

/** Zapis listy dokumentów w zamówieniu (reszta danych klienta bez zmian). */
export async function zapiszDokumenty(sb: SupabaseClient, z: ZamowienieZDokumentami, dokumenty: DokumentZamowienia[]): Promise<{ ok: boolean; blad?: string }> {
  const klient = { ...z.klient, dokumenty };
  const { error } = await sb.from("zamowienia").update({ klient }).eq("id", z.id);
  if (error) return { ok: false, blad: error.message };
  z.klient = klient;
  return { ok: true };
}
