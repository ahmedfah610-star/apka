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

function param(o: any, ...nazwy: string[]): any | null {
  const params: any[] = o?.parameters ?? [];
  for (const n of nazwy) {
    const p = params.find((x) => String(x?.name ?? "").toLowerCase().includes(n.toLowerCase()));
    if (p) return p;
  }
  return null;
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

// Heurystyka kategorii i wieku — na starcie rozsądne domyślne, łatwe do poprawy w panelu.
function kategoriaIWiek(rozmiary: string[], o: any): { kategoria: Kategoria; wiek: Wiek } {
  const liczby = rozmiary.map((r) => parseInt(r, 10)).filter((n) => Number.isFinite(n));
  const min = liczby.length ? Math.min(...liczby) : 104;
  const plec = (wartosciParametru(param(o, "płeć", "plec", "dla")).join(" ") || "").toLowerCase();

  let kategoria: Kategoria = "dziewczynki";
  if (min <= 86) kategoria = "niemowleta";
  else if (plec.includes("chłop") || plec.includes("chlop")) kategoria = "chlopcy";
  else if (plec.includes("dziew")) kategoria = "dziewczynki";

  const wiek: Wiek = min <= 98 ? "0-2" : min <= 128 ? "2-6" : "6-12";
  return { kategoria, wiek };
}

// ── Mapowanie pojedynczej oferty na wiersz produktu ─────────────────────

export function mapujOferte(o: any): Record<string, unknown> {
  const zdjeciaGlowne: string[] = (o?.images ?? []).map((i: any) => String(i?.url ?? i)).filter(Boolean);
  const { opis, opisHtml, zdjeciaOpis } = opisIZdjeciaZOpisu(o);
  const zdjecia = [...new Set([...zdjeciaGlowne, ...zdjeciaOpis])];

  const rozmiary = wartosciParametru(param(o, "rozmiar"));
  const kolor = wartosciParametru(param(o, "kolor"))[0] ?? null;
  const { kategoria, wiek } = kategoriaIWiek(rozmiary, o);
  const offerId = String(o?.id ?? "");

  return {
    id: `al-${offerId}`,
    allegro_id: offerId,
    nazwa: String(o?.name ?? "").trim(),
    cena: cena(o),
    kategoria,
    wiek,
    wiek_label: WIEK_LABEL[wiek],
    badge: null,
    rozmiary,
    kolor,
    zdjecie: zdjecia[0] ?? null,
    zdjecia,
    opis: opis || null,
    opis_html: opisHtml || null, // pełny opis w oryginalnym HTML
    allegro_surowe: o,           // KOMPLETNA oferta z Allegro (wszystkie dane)
    stan: stan(o),
    stan_rozmiary: null,
    ukryty: false,
    hue: HUE[kategoria],
  };
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

export interface WynikImportu { ok: boolean; pobrano: number; zapisano: number; bledy: number; blad?: string }

/** Pobiera wszystkie oferty, mapuje i zapisuje do bazy (upsert po id). */
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
      const wiersz = mapujOferte({ ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (!wiersz.nazwa || !wiersz.allegro_id) { bledy++; continue; }
      const { error } = await sb.from("produkty").upsert(wiersz, { onConflict: "id" });
      if (error) bledy++;
      else zapisano++;
    } catch {
      bledy++;
    }
  }
  return { ok: true, pobrano: lista.length, zapisano, bledy };
}
