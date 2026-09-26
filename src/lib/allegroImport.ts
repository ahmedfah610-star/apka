import { allegroGet } from "@/lib/allegro";
import { sbService } from "@/lib/supabase";
import { ladnaNazwa } from "@/lib/nazwa";
import { porownajRozmiary, rozmiarDorosly } from "@/lib/rozmiary";
import { oczyscTekstOpisu } from "@/lib/opis";
import { rodzinaKoloru } from "@/lib/kolory";
import type { Kategoria, Wiek } from "@/data/produkty";

// Mapowanie ofert z Allegro na produkty sklepu. Wyciąga: nazwę, cenę, wszystkie
// zdjęcia, pełny opis, rozmiary, kolor i stan (ilość sztuk). Zapis do Supabase
// z deterministycznym id (al-<offerId>) — ponowny import aktualizuje, nie duplikuje.

/* eslint-disable @typescript-eslint/no-explicit-any */

const HUE: Record<Kategoria, number> = { dziewczynki: 340, chlopcy: 230, niemowleta: 160, dorosli: 90 };
const WIEK_LABEL: Record<Wiek, string> = { "0-2": "0-2 lata", "2-6": "2-6 lat", "6-12": "6-12 lat", dorosli: "rozmiar dorosły" };

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
export function bazaNazwy(n: string): string {
  return (n || "")
    .replace(/\d+\s*[-–]\s*\d+/g, " ") // zakresy: 62-68, 86- 92
    .replace(/\brozm\.?\b/gi, " ")
    .replace(/\d+/g, " ") // pojedyncze liczby (rozmiary)
    .replace(/[+/,–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Rozmiary literowe na końcu (odzież dorosła: „M/L", „XXL/XXXL", „2XL" → „XL"),
    // inaczej każdy rozmiar byłby osobnym produktem.
    .replace(/(\s+(x{0,4}s|x{0,4}l|m))+$/i, "")
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

// Rozmiary ≤ tego progu = odzież niemowlęca (0–2 lata) → kategoria „niemowlęta".
const PROG_NIEMOWLE = 92;

// Płeć wyłącznie z NAZWY (obejmuje literówki i typowe „dziewczęce"/„chłopięce" słowa).
function plecZNazwy(nazwa: string): Kategoria | null {
  const n = (nazwa || "").toLowerCase();
  const chlopiec = /chłop|chlop/.test(n);
  const dziewczynka = /dziewcz|dziwcz|dzieczyn|sukien|legins|leggin|getr|rybaczk|tunik|kolark|falban|serduszk|księżn|ksiezn/.test(n);
  if (chlopiec && !dziewczynka) return "chlopcy";
  if (dziewczynka && !chlopiec) return "dziewczynki";
  return null;
}

// Silny sygnał „to ubranko niemowlęce" z nazwy — dla ofert bez podanego rozmiaru.
function nazwaNiemowleca(nazwa: string): boolean {
  return /niemowl|pajac|śpioch|spioch|półśpioch|polspioch|noworod|kaftanik|becik|rożek|rozek|body/i.test(nazwa || "");
}

function wiekZRozmiaru(min: number): Wiek {
  return min <= 98 ? "0-2" : min <= 128 ? "2-6" : "6-12";
}

// Odzież damska — sklep jej NIE prowadzi; takie oferty są pomijane przy imporcie.
// (Tylko jednoznaczne słowa — „spódnica" sama w sobie bywa dziewczęca.)
export function czyDamski(nazwa: string): boolean {
  return /damsk|kobiec|dla kobiet|dla mamy/i.test(nazwa || "");
}

// Produkt dla dorosłych — z nazwy (męskie/dorosłe) albo z rozmiaru literowego.
function czyDorosly(nazwa: string, rozmiary: string[]): boolean {
  if (/męsk|meski|dorosł|dorosl|mężczyzn|dla taty/i.test(nazwa || "")) return true;
  return (rozmiary || []).some(rozmiarDorosly);
}

/**
 * Kategoria + wiek na podstawie ROZMIARÓW i nazwy. Kolejność: (1) DOROSŁY (męskie/
 * rozmiar literowy) → osobny dział; (2) małe rozmiary (≤92) → niemowlęta;
 * (3) starszaki → płeć z nazwy/parametru, inaczej „obecna" lub niemowlęta.
 */
function kategoriaIWiek(
  rozmiary: string[] | string,
  o: any,
  nazwa: string,
  obecna?: Kategoria,
): { kategoria: Kategoria; wiek: Wiek } {
  const lista = Array.isArray(rozmiary) ? rozmiary : [rozmiary];

  // (1) Dorośli — najwyższy priorytet.
  if (czyDorosly(nazwa, lista)) return { kategoria: "dorosli", wiek: "dorosli" };

  const liczby = lista.map((r) => parseInt(String(r), 10)).filter((x) => Number.isFinite(x));
  const min = liczby.length ? Math.min(...liczby) : 104;
  const max = liczby.length ? Math.max(...liczby) : 104;
  const wiek = wiekZRozmiaru(min);

  const niemowle = liczby.length ? max <= PROG_NIEMOWLE : nazwaNiemowleca(nazwa);
  if (niemowle) return { kategoria: "niemowleta", wiek };

  // Starszak → płeć z nazwy, potem z parametru Płeć (import), inaczej zachowaj/uniseks.
  const zNazwy = plecZNazwy(nazwa);
  if (zNazwy) return { kategoria: zNazwy, wiek };
  const plec = wartosciParametru(param(o, "płeć", "plec")).join(" ").toLowerCase();
  if (plec.includes("chłop") && !plec.includes("dziew")) return { kategoria: "chlopcy", wiek };
  if (plec.includes("dziew") && !plec.includes("chłop")) return { kategoria: "dziewczynki", wiek };
  return { kategoria: obecna === "chlopcy" || obecna === "dziewczynki" ? obecna : "niemowleta", wiek };
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
    // Opis TEGO rozmiaru (na Allegro każdy rozmiar = osobna oferta z własnymi wymiarami).
    opis_rozmiary: rozmiar && opisHtml ? { [rozmiar]: opisHtml } : null,
    allegro_surowe: o,           // KOMPLETNA oferta z Allegro (wszystkie dane)
    stan: sztuk,
    stan_rozmiary: rozmiar ? { [rozmiar]: sztuk } : null,
    // Surowy wiersz oferty jest ukryty — w sklepie pojawia się dopiero scalony produkt
    // (inaczej podczas importu bez czyszczenia byłyby widoczne duplikaty).
    ukryty: true,
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
async function zapiszZgrupowane(sb: any, det: any): Promise<{ ok: boolean; pominiety?: boolean; blad?: string }> {
  if (czyDamski(String(det?.name ?? ""))) return { ok: true, pominiety: true };
  const m = mapujOferte(det);
  const w = m.wiersz;
  if (!w.nazwa || !w.allegro_id) return { ok: false, blad: `brak nazwy/id (productId="${w.allegro_id}", nazwa="${w.nazwa}")` };

  const { data: istn } = await sb
    .from("produkty")
    .select("rozmiary, stan_rozmiary, zdjecia, opis, opis_html, opis_rozmiary, kolor")
    .eq("id", w.id)
    .maybeSingle();

  if (istn) {
    const sr: Record<string, number> = { ...(istn.stan_rozmiary ?? {}) };
    if (m.rozmiar) sr[m.rozmiar] = m.sztuk; // SET (nie dodawaj) — idempotentne przy duplikatach
    const rozm = Array.from(new Set([...(istn.rozmiary ?? []), ...(m.rozmiar ? [m.rozmiar] : [])])).sort(porownajRozmiary);
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
    const orz = { ...(istn.opis_rozmiary ?? {}), ...((w.opis_rozmiary as Record<string, string>) ?? {}) };
    w.opis_rozmiary = Object.keys(orz).length ? orz : null;
  }

  const { error } = await sb.from("produkty").upsert(w, { onConflict: "id" });
  return error ? { ok: false, blad: error.message } : { ok: true };
}

// Przelicza kategorię/wiek na JUŻ zaimportowanych produktach (bez pobierania z Allegro).
export async function przeklasyfikuj(): Promise<{ ok: boolean; zmieniono: number; blad?: string }> {
  const sb = sbService();
  if (!sb) return { ok: false, zmieniono: 0, blad: "Brak bazy." };
  // Stronicowanie (limit 1000/zapytanie) — obejmuje też produkty poza pierwszym tysiącem.
  const wszystkie: any[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await sb.from("produkty").select("id, nazwa, rozmiary, kategoria, wiek").like("id", "al-%").order("id").range(from, from + 999);
    if (error) return { ok: false, zmieniono: 0, blad: error.message };
    wszystkie.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  let zmieniono = 0;
  for (const r of wszystkie as any[]) {
    const { kategoria, wiek } = kategoriaIWiek(r.rozmiary ?? [], {}, r.nazwa ?? "", r.kategoria as Kategoria);
    if (kategoria === r.kategoria && wiek === r.wiek) continue; // bez zmian — nie pisz
    const { error: e } = await sb.from("produkty").update({ kategoria, wiek, wiek_label: WIEK_LABEL[wiek], hue: HUE[kategoria] }).eq("id", r.id);
    if (!e) zmieniono++;
  }
  return { ok: true, zmieniono };
}

// Klucz łączenia ofert w jeden produkt: nazwa (bez rozmiarów) + kolor + cena + wzór
// (początek opisu). Opis bez cyfr i zdań o „aukcjach" — sprzedawca wystawia każdy
// rozmiar osobno z opisem „WZROST 56 CM…"/„WZROST 62 CM…"; to ten sam produkt.
// Nazwa przez ladnaNazwa — ta sama postać dla świeżej oferty i już scalonego wiersza.
export function kluczScalania(p: any): string {
  const nazwa = ladnaNazwa(bazaNazwy(p.nazwa || "")).toLowerCase();
  const wzor = (oczyscTekstOpisu(p.opis) || "")
    .toLowerCase()
    .replace(/\d+/g, " ")
    .replace(/[^a-ząćęłńóśźż ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return `${nazwa}|${(p.kolor || "").toLowerCase()}|${Number(p.cena ?? 0).toFixed(2)}|${wzor}`;
}

// Kolory zdjęć z analizy obrazu (tabela zdjecia_kolory) — brak tabeli = pusta mapa.
async function koloryZdjec(sb: any): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  for (let from = 0; from < 100000; from += 1000) {
    const { data, error } = await sb.from("zdjecia_kolory").select("url, rodzina").range(from, from + 999);
    if (error || !data) break;
    for (const r of data) m.set(r.url, r.rodzina);
    if (data.length < 1000) break;
  }
  return m;
}

// Zdjęcie w kolorze wariantu na początek (np. „szary" sweterek nie może zaczynać
// się zdjęciem zielonego). Zmienia kolejność tylko, gdy pierwsze zdjęcie NIE pasuje,
// a w galerii jest takie, które pasuje.
function zdjeciaWgKoloru(zdjecia: string[], kolor: string | null, kolory: Map<string, string>): string[] {
  const cel = rodzinaKoloru(kolor);
  if (!cel || zdjecia.length < 2 || kolory.get(zdjecia[0]) === cel) return zdjecia;
  const pasujace = zdjecia.filter((z) => kolory.get(z) === cel);
  if (!pasujace.length) return zdjecia;
  return [...pasujace, ...zdjecia.filter((z) => kolory.get(z) !== cel)];
}

/**
 * Scala oferty w produkty (osobna oferta na rozmiar → jeden produkt z rozmiarami).
 * Działa na świeżo zaimportowanych ofertach (al-<id>) i już scalonych produktach
 * (al-m-…): świeże dane mają pierwszeństwo, scalony wiersz daje stabilne ID i ręczne
 * ustawienia z panelu (ukrycie, etykieta).
 * usunNieaktualne — tylko po PEŁNYM imporcie: scalone produkty, dla których nie
 * przyszła żadna aktywna oferta, są usuwane (oferta zakończona na Allegro).
 */
export async function scalProdukty(
  opcje: { usunNieaktualne?: boolean } = {},
): Promise<{ ok: boolean; przed: number; po: number; usunieteNieaktualne?: number; blad?: string }> {
  const sb = sbService();
  if (!sb) return { ok: false, przed: 0, po: 0, blad: "Brak bazy." };

  const kolumny = "id, nazwa, kolor, cena, kategoria, rozmiary, stan_rozmiary, zdjecia, zdjecie, opis, opis_html, opis_rozmiary, badge, ukryty";
  const wszystkie: any[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await sb.from("produkty").select(kolumny).like("id", "al-%").order("id").range(from, from + 999);
    if (error) return { ok: false, przed: wszystkie.length, po: 0, blad: error.message };
    wszystkie.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  const przed = wszystkie.length;
  if (przed === 0) return { ok: true, przed: 0, po: 0 };
  const kolory = await koloryZdjec(sb);
  const scalonyWiersz = (p: any) => String(p.id).startsWith("al-m-");

  const grupy = new Map<string, any[]>();
  for (const p of wszystkie) {
    const key = kluczScalania(p);
    const arr = grupy.get(key);
    if (arr) arr.push(p);
    else grupy.set(key, [p]);
  }

  const scalone: any[] = [];
  const uzyteId = new Set<string>();
  const zbedneScalone: string[] = []; // al-m-… wchłonięte przez inny scalony wiersz tej samej grupy
  const nieaktualne: string[] = []; // scalone bez żadnej świeżej oferty (przy usunNieaktualne)
  for (const [key, grupa] of grupy) {
    const stare = grupa.filter(scalonyWiersz);
    const swieze = grupa.filter((p) => !scalonyWiersz(p));
    if (opcje.usunNieaktualne && swieze.length === 0) {
      nieaktualne.push(...stare.map((p) => String(p.id)));
      continue;
    }
    // Dane produktu: ze świeżych ofert, jeśli są (aktualne stany/rozmiary), inaczej ze scalonego.
    const zrodlo = swieze.length ? swieze : stare;
    const first = zrodlo[0];
    const sr: Record<string, number> = {};
    const rozm = new Set<string>();
    const zdj = new Set<string>();
    const opisyRozm: Record<string, string> = {};
    let opis: string | null = null, opisHtml: string | null = null;
    for (const p of zrodlo) {
      for (const r of p.rozmiary ?? []) rozm.add(String(r));
      for (const [r, v] of Object.entries(p.stan_rozmiary ?? {})) sr[r] = Math.max(sr[r] ?? 0, Number(v) || 0);
      for (const z of p.zdjecia ?? []) zdj.add(String(z));
      for (const [r, h] of Object.entries(p.opis_rozmiary ?? {})) if (!opisyRozm[r] && h) opisyRozm[r] = String(h);
      if (!opis && p.opis) opis = p.opis;
      if (!opisHtml && p.opis_html) opisHtml = p.opis_html;
    }
    const rozmiary = [...rozm].sort(porownajRozmiary);
    // Większość dotychczasowych kategorii w grupie = „obecna" (fallback dla starszaków
    // bez płci w nazwie — niesie płeć z parametru Płeć ustaloną przy imporcie).
    const glosy = new Map<Kategoria, number>();
    for (const p of grupa) {
      const k = (p.kategoria as Kategoria) || "niemowleta";
      glosy.set(k, (glosy.get(k) ?? 0) + 1);
    }
    const obecna: Kategoria = [...glosy.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "niemowleta";
    // Reguła: małe rozmiary (≤92) → niemowlęta; starszaki → płeć z nazwy/obecna.
    const { kategoria, wiek } = kategoriaIWiek(rozmiary, {}, first.nazwa || "", obecna);
    const zdjecia = zdjeciaWgKoloru([...zdj], first.kolor ?? null, kolory);
    // Stabilne ID: gdy grupa zawiera już scalony produkt (al-m-…), zachowaj jego ID.
    // Inaczej każda zmiana nazwy/opisu dawała nowy wiersz i nowy adres strony.
    const kanon = "al-m-" + hash36(key);
    const istniejace = stare.map((p) => String(p.id)).sort();
    let id = istniejace.includes(kanon) ? kanon : (istniejace[0] ?? kanon);
    if (uzyteId.has(id)) id = kanon + "-" + uzyteId.size.toString(36);
    uzyteId.add(id);
    zbedneScalone.push(...istniejace.filter((x) => x !== id));
    const poprzedni = stare.find((p) => String(p.id) === id) ?? stare[0];
    scalone.push({
      id,
      allegro_id: id.slice(3),
      nazwa: ladnaNazwa(bazaNazwy(first.nazwa || "")) || first.nazwa || "Produkt",
      cena: first.cena ?? 0,
      kategoria, wiek, wiek_label: WIEK_LABEL[wiek],
      badge: poprzedni?.badge ?? null, // etykieta ustawiona w panelu zostaje
      rozmiary, kolor: first.kolor ?? null,
      zdjecie: zdjecia[0] ?? first.zdjecie ?? null, zdjecia,
      opis, opis_html: opisHtml,
      opis_rozmiary: Object.keys(opisyRozm).length ? opisyRozm : null,
      stan: Object.values(sr).reduce((a, b) => a + b, 0),
      stan_rozmiary: Object.keys(sr).length ? sr : null,
      ukryty: stare.length > 0 && stare.every((p) => p.ukryty === true), // ukryty w panelu zostaje ukryty
      hue: HUE[kategoria],
    });
  }

  // Bezpiecznik: jeśli „nieaktualnych" jest podejrzanie dużo (np. import się urwał),
  // nie kasujemy ich — zostają jak były.
  const liczbaScalonych = wszystkie.filter(scalonyWiersz).length;
  if (nieaktualne.length > liczbaScalonych * 0.3) {
    for (const id of nieaktualne) uzyteId.add(id); // zostają w bazie bez zmian
    nieaktualne.length = 0;
  }

  for (let i = 0; i < scalone.length; i += 200) {
    const { error } = await sb.from("produkty").upsert(scalone.slice(i, i + 200), { onConflict: "id" });
    if (error) return { ok: false, przed, po: 0, blad: error.message };
  }
  // Usuń pojedyncze oferty (al- ale nie scalone al-m-).
  await sb.from("produkty").delete().like("id", "al-%").not("id", "like", "al-m-%");
  // Usuń scalone wiersze wchłonięte przez inny w tej samej grupie oraz zakończone oferty.
  const doUsuniecia = [...zbedneScalone, ...nieaktualne].filter((x) => !uzyteId.has(x)); // nigdy nie kasuj ID nadanego w tym przebiegu
  for (let i = 0; i < doUsuniecia.length; i += 200) {
    await sb.from("produkty").delete().in("id", doUsuniecia.slice(i, i + 200));
  }
  return { ok: true, przed, po: scalone.length, usunieteNieaktualne: nieaktualne.length };
}

export interface WynikImportu { ok: boolean; pobrano: number; zapisano: number; pominiete?: number; bledy: number; blad?: string }

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
  let pominiete = 0; // odzież damska — sklep jej nie prowadzi
  let bledy = 0;
  let pierwszyBlad: string | undefined;
  for (const of of lista) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r.pominiety) pominiete++;
      else if (r.ok) zapisano++;
      else { bledy++; if (!pierwszyBlad) pierwszyBlad = r.blad; }
    } catch (e) {
      bledy++;
      if (!pierwszyBlad) pierwszyBlad = e instanceof Error ? e.message : "wyjątek";
    }
  }
  return { ok: true, pobrano: lista.length, zapisano, pominiete, bledy, blad: bledy ? pierwszyBlad : undefined };
}

export interface WynikStrony { ok: boolean; pobrano: number; zapisano: number; pominiete?: number; bledy: number; koniec: boolean; blad?: string }

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
  let pominiete = 0; // odzież damska — sklep jej nie prowadzi
  let bledy = 0;
  let pierwszyBlad: string | undefined;
  for (const of of partia) {
    try {
      const det = await szczegoly(of.id);
      const r = await zapiszZgrupowane(sb, { ...det, id: det?.id ?? of.id, name: det?.name ?? of.name });
      if (r.pominiety) pominiete++;
      else if (r.ok) zapisano++;
      else { bledy++; if (!pierwszyBlad) pierwszyBlad = r.blad; }
    } catch (e) {
      bledy++;
      if (!pierwszyBlad) pierwszyBlad = e instanceof Error ? e.message : "wyjątek";
    }
  }
  return { ok: true, pobrano: partia.length, zapisano, pominiete, bledy, koniec: partia.length < limit, blad: bledy ? pierwszyBlad : undefined };
}
