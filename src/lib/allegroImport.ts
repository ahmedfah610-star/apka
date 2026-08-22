import { allegroGet } from "@/lib/allegro";
import { sbService } from "@/lib/supabase";
import type { Kategoria, Wiek } from "@/data/produkty";

// Mapowanie ofert z Allegro na produkty sklepu. Wyciąga: nazwę, cenę, wszystkie
// zdjęcia, pełny opis, rozmiary, kolor i stan (ilość sztuk). Zapis do Supabase
// z deterministycznym id (al-<offerId>) — ponowny import aktualizuje, nie duplikuje.

/* eslint-disable @typescript-eslint/no-explicit-any */

const HUE: Record<Kategoria, number> = { dziewczynki: 340, chlopcy: 230, niemowleta: 160 };
const WIEK_LABEL: Record<Wiek, string> = { "0-2": "0-2 lata", "2-6": "2-6 lat", "6-12": "6-12 lat" };

// ── Pomocnicze wyciąganie pól z oferty ──────────────────────────────────

// Parametry oferty ORAZ powiązanego produktu (Kolor/Rozmiar/Płeć siedzą w produkcie).
function wszystkieParametry(o: any): any[] {
  const oferta: any[] = o?.parameters ?? [];
  const prod: any[] = (Array.isArray(o?.productSet) && o.productSet[0]?.product?.parameters) || o?.product?.parameters || [];
  return [...prod, ...oferta];
}
function param(o: any, ...nazwy: string[]): any | null {
  const params = wszystkieParametry(o);
  for (const n of nazwy) {
    const p = params.find((x) => String(x?.name ?? "").toLowerCase() === n.toLowerCase());
    if (p) return p;
  }
  // dopasowanie częściowe, gdyby nazwa się różniła
  for (const n of nazwy) {
    const p = params.find((x) => String(x?.name ?? "").toLowerCase().includes(n.toLowerCase()));
    if (p) return p;
  }
  return null;
}
function idProduktu(o: any): string {
  return String((Array.isArray(o?.productSet) && o.productSet[0]?.product?.id) || o?.product?.id || o?.id || "");
}
function wartosciParametru(p: any): string[] {
  if (!p) return [];
  if (Array.isArray(p.values) && p.values.length) return p.values.map((v: any) => String(v)).filter(Boolean);
  if (Array.isArray(p.valuesLabels) && p.valuesLabels.length) return p.valuesLabels.map((v: any) => String(v));
  return [];
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pełny opis: wersja czytelna (tekst), oryginalny HTML oraz zdjęcia z opisu.
function opisIZdjeciaZOpisu(o: any): { opis: string; opisHtml: string; zdjeciaOpis: string[] } {
  const sekcje: any[] = o?.description?.sections ?? [];
  const teksty: string[] = [];
  const html: string[] = [];
  const zdj: string[] = [];
  for (const s of sekcje) {
    for (const it of s?.items ?? []) {
      if (it?.type === "TEXT" && it.content) {
        html.push(String(it.content)); // oryginalny HTML — pełny opis
        teksty.push(stripHtml(String(it.content)));
      }
      if (it?.type === "IMAGE" && it.url) {
        html.push(`<img src="${String(it.url)}" alt="" />`);
        zdj.push(String(it.url));
      }
    }
  }
  return { opis: teksty.join("\n\n").trim(), opisHtml: html.join("\n").trim(), zdjeciaOpis: zdj };
}

function cena(o: any): number {
  const a = o?.sellingMode?.price?.amount ?? o?.sellingMode?.startingPrice?.amount ?? o?.price?.amount;
  const n = parseFloat(String(a ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function stan(o: any): number | null {
  const s = o?.stock?.available ?? o?.stock?.sold;
  const n = Number(o?.stock?.available);
  return Number.isFinite(n) ? n : (typeof s === "number" ? s : null);
}

// Kategoria + wiek na podstawie rozmiaru i płci.
function kategoriaIWiek(rozmiar: string, o: any): { kategoria: Kategoria; wiek: Wiek } {
  const n = parseInt(rozmiar, 10);
  const min = Number.isFinite(n) ? n : 104;
  const plec = wartosciParametru(param(o, "płeć", "plec", "dla dzieci")).join(" ").toLowerCase();
  const tylkoChlopcy = plec.includes("chłop") && !plec.includes("dziew");
  const tylkoDziewczynki = plec.includes("dziew") && !plec.includes("chłop");

  let kategoria: Kategoria = "dziewczynki";
  if (min <= 86) kategoria = "niemowleta";
  else if (tylkoChlopcy) kategoria = "chlopcy";
  else if (tylkoDziewczynki) kategoria = "dziewczynki";

  const wiek: Wiek = min <= 98 ? "0-2" : min <= 128 ? "2-6" : "6-12";
  return { kategoria, wiek };
}

export interface OfertaZmapowana {
  productId: string;
  rozmiar: string | null;
  sztuk: number;
  wiersz: Record<string, unknown>;
}

// Mapuje jedną ofertę (= zwykle jeden rozmiar) na dane produktu + info o wariancie.
export function mapujOferte(o: any): OfertaZmapowana {
  const zdjeciaGlowne: string[] = (o?.images ?? []).map((i: any) => String(i?.url ?? i)).filter(Boolean);
  const { opis, opisHtml, zdjeciaOpis } = opisIZdjeciaZOpisu(o);
  const zdjecia = [...new Set([...zdjeciaGlowne, ...zdjeciaOpis])];

  const rozmiar = wartosciParametru(param(o, "rozmiar"))[0] ?? null;
  const barwa = wartosciParametru(param(o, "kolor"))[0] ?? null;
  const odcien = wartosciParametru(param(o, "odcień", "odcien"))[0] ?? null;
  const kolor = barwa ? (odcien && odcien.toLowerCase() !== barwa.toLowerCase() ? `${barwa} (${odcien})` : barwa) : null;
  const { kategoria, wiek } = kategoriaIWiek(rozmiar ?? "", o);
  const sztuk = stan(o) ?? 0;
  const productId = idProduktu(o);

  const wiersz: Record<string, unknown> = {
    id: `al-${productId}`,
    allegro_id: productId,
    nazwa: String(o?.name ?? "").trim(),
    cena: cena(o),
    kategoria,
    wiek,
    wiek_label: WIEK_LABEL[wiek],
    badge: null,
    rozmiary: rozmiar ? [rozmiar] : [],
    kolor,
    zdjecie: zdjecia[0] ?? null,
    zdjecia,
    opis: opis || null,
    opis_html: opisHtml || null, // pełny opis w oryginalnym HTML
    allegro_surowe: o,           // KOMPLETNA oferta z Allegro (wszystkie dane)
    stan: sztuk,
    stan_rozmiary: rozmiar ? { [rozmiar]: sztuk } : null,
    ukryty: false,
    hue: HUE[kategoria],
  };
  return { productId, rozmiar, sztuk, wiersz };
}

// ── Pobranie i import wszystkich ofert ──────────────────────────────────

interface OfertaLista { id: string; name: string; publication?: { status?: string } }

/** Lista ofert sprzedawcy (stronicowana). Domyślnie tylko aktywne. */
async function listaOfert(tylkoAktywne = true): Promise<OfertaLista[]> {
  const wynik: OfertaLista[] = [];
  let offset = 0;
  const limit = 100;
  for (let i = 0; i < 50; i++) {
    const q = `/sale/offers?limit=${limit}&offset=${offset}${tylkoAktywne ? "&publication.status=ACTIVE" : ""}`;
    const d = await allegroGet<{ offers?: OfertaLista[]; totalCount?: number }>(q);
    const partia = d.offers ?? [];
    wynik.push(...partia);
    offset += limit;
    if (partia.length < limit) break;
  }
  return wynik;
}

/** Szczegóły oferty (opis, parametry, zdjęcia, stan). */
async function szczegoly(id: string): Promise<any> {
  try {
    return await allegroGet<any>(`/sale/product-offers/${id}`);
  } catch {
    return await allegroGet<any>(`/sale/offers/${id}`);
  }
}

// Zapis jednej oferty z GRUPOWANIEM wariantów rozmiaru w jeden produkt.
// Read-modify-write: dokłada rozmiar + stan do istniejącego produktu (po al-<productId>).
async function zapiszZgrupowane(sb: any, det: any): Promise<"ok" | "blad"> {
  const m = mapujOferte(det);
  const w = m.wiersz;
  if (!w.nazwa || !w.allegro_id) return "blad";

  const { data: istn } = await sb
    .from("produkty")
    .select("rozmiary, stan_rozmiary, zdjecia, opis, opis_html, kolor")
    .eq("id", w.id)
    .maybeSingle();

  if (istn) {
    const sr: Record<string, number> = { ...(istn.stan_rozmiary ?? {}) };
    if (m.rozmiar) sr[m.rozmiar] = m.sztuk; // SET (nie dodawaj) — idempotentne przy duplikatach
    const rozm = Array.from(new Set([...(istn.rozmiary ?? []), ...(m.rozmiar ? [m.rozmiar] : [])])).sort(
      (a: string, b: string) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0),
    );
    const zdj = Array.from(new Set([...((istn.zdjecia as string[]) ?? []), ...((w.zdjecia as string[]) ?? [])]));
    w.stan_rozmiary = Object.keys(sr).length ? sr : null;
    w.stan = Object.values(sr).reduce((s: number, v) => s + (Number(v) || 0), 0);
    w.rozmiary = rozm;
    w.zdjecia = zdj;
    w.zdjecie = zdj[0] ?? w.zdjecie;
    // Nie nadpisuj dobrych wartości pustkami z tego wariantu.
    w.opis = (w.opis as string) || istn.opis || null;
    w.opis_html = (w.opis_html as string) || istn.opis_html || null;
    w.kolor = (w.kolor as string) || istn.kolor || null;
  }

  const { error } = await sb.from("produkty").upsert(w, { onConflict: "id" });
  return error ? "blad" : "ok";
}

export interface WynikImportu { ok: boolean; pobrano: number; zapisano: number; bledy: number; blad?: string }

/** Pobiera wszystkie oferty, mapuje i zapisuje do bazy (grupuje warianty). */
export async function importujWszystko(tylkoAktywne = true): Promise<WynikImportu> {
  const sb = sbService();
  if (!sb) return { ok: false, pobrano: 0, zapisano: 0, bledy: 0, blad: "Brak bazy." };

  let lista: OfertaLista[];
  try {
    lista = await listaOfert(tylkoAktywne);
  } catch (e) {
    return { ok: false, pobrano: 0, zapisano: 0, bledy: 0, blad: e instanceof Error ? e.message : "Błąd pobierania listy." };
  }

  let zapisano = 0;
  let bledy = 0;
  for (const of of lista) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r === "ok") zapisano++;
      else bledy++;
    } catch {
      bledy++;
    }
  }
  return { ok: true, pobrano: lista.length, zapisano, bledy };
}

export interface WynikStrony { ok: boolean; pobrano: number; zapisano: number; bledy: number; koniec: boolean; blad?: string }

/**
 * Import JEDNEJ porcji ofert (dla planu Hobby: krótkie żądania < 60 s).
 * Panel woła to w pętli, zwiększając offset, aż koniec === true.
 */
export async function importujStrone(offset: number, limit = 8, tylkoAktywne = true): Promise<WynikStrony> {
  const sb = sbService();
  if (!sb) return { ok: false, pobrano: 0, zapisano: 0, bledy: 0, koniec: true, blad: "Brak bazy." };

  let partia: OfertaLista[];
  try {
    const q = `/sale/offers?limit=${limit}&offset=${offset}${tylkoAktywne ? "&publication.status=ACTIVE" : ""}`;
    const d = await allegroGet<{ offers?: OfertaLista[] }>(q);
    partia = d.offers ?? [];
  } catch (e) {
    return { ok: false, pobrano: 0, zapisano: 0, bledy: 0, koniec: true, blad: e instanceof Error ? e.message : "Błąd pobierania listy." };
  }

  let zapisano = 0;
  let bledy = 0;
  for (const of of partia) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r === "ok") zapisano++;
      else bledy++;
    } catch {
      bledy++;
    }
  }
  return { ok: true, pobrano: partia.length, zapisano, bledy, koniec: partia.length < limit };
}
