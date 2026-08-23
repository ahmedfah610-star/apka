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

// Nazwa bez rozmiarów/zakresów — do grupowania „osobnych ofert = jeden produkt".
function bazaNazwy(n: string): string {
  return (n || "")
    .replace(/\d+\s*[-–]\s*\d+/g, " ") // zakresy: 62-68, 86- 92
    .replace(/\brozm\.?\b/gi, " ")
    .replace(/\d+/g, " ") // pojedyncze liczby (rozmiary)
    .replace(/[+/,–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function hash36(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
// Klucz grupy: baza nazwy + kolor (czerwony i niebieski = osobne produkty).
function kluczGrupy(nazwa: string, kolor: string | null): string {
  return hash36(bazaNazwy(nazwa).toLowerCase() + "|" + (kolor || "").toLowerCase());
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

// Prosta sanityzacja HTML opisu (treść z własnych ofert Allegro, ale na wszelki wypadek).
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
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
        html.push(sanitizeHtml(String(it.content))); // pełny opis (tekst) w HTML
        teksty.push(stripHtml(String(it.content)));
      }
      if (it?.type === "IMAGE" && it.url) {
        html.push(`<img src="${String(it.url)}" alt="" loading="lazy" />`); // grafiki opisu
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

// Kategoria + wiek. PŁEĆ (z nazwy lub parametru) ma pierwszeństwo przed rozmiarem;
// dopiero rzeczy bez sygnału płci trafiają do „niemowlęta".
function kategoriaIWiek(rozmiar: string, o: any, nazwa: string): { kategoria: Kategoria; wiek: Wiek } {
  const liczba = parseInt(rozmiar, 10);
  const min = Number.isFinite(liczba) ? liczba : 104;
  const n = (nazwa || "").toLowerCase();
  const plec = wartosciParametru(param(o, "płeć", "plec")).join(" ").toLowerCase();

  // Uwzględnia literówki sprzedawcy (np. „dziwczynki").
  const chlopiec = /chłop|chlop/.test(n) || (plec.includes("chłop") && !plec.includes("dziew"));
  const dziewczynka = /dziewcz|dziwcz|dziewczyn|sukienk|legins/.test(n) || (plec.includes("dziew") && !plec.includes("chłop"));

  let kategoria: Kategoria;
  if (chlopiec && !dziewczynka) kategoria = "chlopcy";
  else if (dziewczynka && !chlopiec) kategoria = "dziewczynki";
  else kategoria = "niemowleta"; // niemowlęce / uniseks bez wyraźnej płci

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
  const { opis, opisHtml } = opisIZdjeciaZOpisu(o);
  // Galeria = zdjęcia produktu; grafiki z opisu zostają w opisHtml (nie zaśmiecają galerii).
  const zdjecia = [...new Set(zdjeciaGlowne)];

  const rozmiar = wartosciParametru(param(o, "rozmiar"))[0] ?? null;
  const barwa = wartosciParametru(param(o, "kolor"))[0] ?? null;
  const odcien = wartosciParametru(param(o, "odcień", "odcien"))[0] ?? null;
  const kolor = barwa ? (odcien && odcien.toLowerCase() !== barwa.toLowerCase() ? `${barwa} (${odcien})` : barwa) : null;
  const nazwaPelna = String(o?.name ?? "").trim();
  const { kategoria, wiek } = kategoriaIWiek(rozmiar ?? "", o, nazwaPelna);
  const sztuk = stan(o) ?? 0;
  // Grupowanie WYŁĄCZNIE po ID produktu z Allegro — bezpieczne i wierne:
  // łączy rozmiary tylko wtedy, gdy Allegro naprawdę wiąże je jako jeden
  // produkt (warianty). Osobne wystawienia zostają osobno, nic się nie gubi.
  // Grupowanie po nazwie skleja różne rzeczy o tej samej generycznej nazwie.
  const klucz = idProduktu(o) || kluczGrupy(nazwaPelna, kolor);

  const wiersz: Record<string, unknown> = {
    id: `al-${klucz}`,
    allegro_id: klucz,
    nazwa: bazaNazwy(nazwaPelna) || nazwaPelna,
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
  return { productId: klucz, rozmiar, sztuk, wiersz };
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
async function zapiszZgrupowane(sb: any, det: any): Promise<{ ok: boolean; blad?: string }> {
  const m = mapujOferte(det);
  const w = m.wiersz;
  if (!w.nazwa || !w.allegro_id) return { ok: false, blad: `brak nazwy/id (productId="${w.allegro_id}", nazwa="${w.nazwa}")` };

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
  return error ? { ok: false, blad: error.message } : { ok: true };
}

// Przelicza kategorię/wiek na JUŻ zaimportowanych produktach (bez pobierania z Allegro).
export async function przeklasyfikuj(): Promise<{ ok: boolean; zmieniono: number; blad?: string }> {
  const sb = sbService();
  if (!sb) return { ok: false, zmieniono: 0, blad: "Brak bazy." };
  const { data, error } = await sb.from("produkty").select("id, nazwa, rozmiary, allegro_surowe").like("id", "al-%");
  if (error) return { ok: false, zmieniono: 0, blad: error.message };
  let zmieniono = 0;
  for (const r of (data ?? []) as any[]) {
    const minR = (r.rozmiary ?? []).map((x: string) => parseInt(x, 10)).filter((x: number) => Number.isFinite(x)).sort((a: number, b: number) => a - b)[0];
    const { kategoria, wiek } = kategoriaIWiek(minR ? String(minR) : "", r.allegro_surowe ?? {}, r.nazwa ?? "");
    const { error: e } = await sb.from("produkty").update({ kategoria, wiek, wiek_label: WIEK_LABEL[wiek], hue: HUE[kategoria] }).eq("id", r.id);
    if (!e) zmieniono++;
  }
  return { ok: true, zmieniono };
}

// Scala już zaimportowane produkty (osobne oferty na rozmiar) w jeden produkt
// po nazwie(bez rozmiaru)+kolor+cena i poprawia kategorie. Bez pobierania z Allegro.
export async function scalProdukty(): Promise<{ ok: boolean; przed: number; po: number; blad?: string }> {
  const sb = sbService();
  if (!sb) return { ok: false, przed: 0, po: 0, blad: "Brak bazy." };

  const kolumny = "id, nazwa, kolor, cena, rozmiary, stan_rozmiary, zdjecia, zdjecie, opis, opis_html";
  const wszystkie: any[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await sb.from("produkty").select(kolumny).like("id", "al-%").order("id").range(from, from + 999);
    if (error) return { ok: false, przed: wszystkie.length, po: 0, blad: error.message };
    wszystkie.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  const przed = wszystkie.length;
  if (przed === 0) return { ok: true, przed: 0, po: 0 };

  const grupy = new Map<string, any[]>();
  for (const p of wszystkie) {
    const key = bazaNazwy(p.nazwa || "").toLowerCase() + "|" + (p.kolor || "") + "|" + (p.cena ?? "");
    const arr = grupy.get(key); if (arr) arr.push(p); else grupy.set(key, [p]);
  }

  const scalone: any[] = [];
  for (const [key, grupa] of grupy) {
    const first = grupa[0];
    const sr: Record<string, number> = {};
    const rozm = new Set<string>();
    const zdj = new Set<string>();
    let opis: string | null = null, opisHtml: string | null = null;
    for (const p of grupa) {
      for (const r of p.rozmiary ?? []) rozm.add(String(r));
      for (const [s, v] of Object.entries(p.stan_rozmiary ?? {})) sr[s] = Math.max(sr[s] ?? 0, Number(v) || 0);
      for (const z of p.zdjecia ?? []) zdj.add(String(z));
      if (!opis && p.opis) opis = p.opis;
      if (!opisHtml && p.opis_html) opisHtml = p.opis_html;
    }
    const rozmiary = [...rozm].sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
    const minR = rozmiary.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x)).sort((a, b) => a - b)[0];
    const { kategoria, wiek } = kategoriaIWiek(minR ? String(minR) : "", {}, first.nazwa || "");
    const zdjecia = [...zdj];
    const h = hash36(key);
    scalone.push({
      id: "al-m-" + h,
      allegro_id: "m-" + h,
      nazwa: bazaNazwy(first.nazwa || "") || first.nazwa || "Produkt",
      cena: first.cena ?? 0,
      kategoria, wiek, wiek_label: WIEK_LABEL[wiek], badge: null,
      rozmiary, kolor: first.kolor ?? null,
      zdjecie: zdjecia[0] ?? first.zdjecie ?? null, zdjecia,
      opis, opis_html: opisHtml,
      stan: Object.values(sr).reduce((a, b) => a + b, 0),
      stan_rozmiary: Object.keys(sr).length ? sr : null,
      ukryty: false, hue: HUE[kategoria],
    });
  }

  for (let i = 0; i < scalone.length; i += 200) {
    const { error } = await sb.from("produkty").upsert(scalone.slice(i, i + 200), { onConflict: "id" });
    if (error) return { ok: false, przed, po: 0, blad: error.message };
  }
  // Usuń pojedyncze oferty (al- ale nie scalone al-m-).
  await sb.from("produkty").delete().like("id", "al-%").not("id", "like", "al-m-%");
  return { ok: true, przed, po: scalone.length };
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
  let pierwszyBlad: string | undefined;
  for (const of of lista) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r.ok) zapisano++;
      else { bledy++; if (!pierwszyBlad) pierwszyBlad = r.blad; }
    } catch (e) {
      bledy++;
      if (!pierwszyBlad) pierwszyBlad = e instanceof Error ? e.message : "wyjątek";
    }
  }
  return { ok: true, pobrano: lista.length, zapisano, bledy, blad: bledy ? pierwszyBlad : undefined };
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
  let pierwszyBlad: string | undefined;
  for (const of of partia) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r.ok) zapisano++;
      else { bledy++; if (!pierwszyBlad) pierwszyBlad = r.blad; }
    } catch (e) {
      bledy++;
      if (!pierwszyBlad) pierwszyBlad = e instanceof Error ? e.message : "wyjątek";
    }
  }
  return { ok: true, pobrano: partia.length, zapisano, bledy, koniec: partia.length < limit, blad: bledy ? pierwszyBlad : undefined };
}
