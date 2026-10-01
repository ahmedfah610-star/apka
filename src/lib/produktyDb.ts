import { PRODUKTY, type Produkt } from "@/data/produkty";
import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";
import { ladnaNazwa } from "@/lib/nazwa";
import { oczyscHtmlOpisu, oczyscTekstOpisu } from "@/lib/opis";
import { przypiszRodziny } from "@/lib/warianty";

// Warstwa danych produktów. Gdy Supabase jest skonfigurowany — czyta z bazy.
// Bez konfiguracji — fallback do katalogu z kodu (238 produktów), więc sklep
// działa zawsze, a po podłączeniu bazy przełącza się automatycznie.

/* eslint-disable @typescript-eslint/no-explicit-any */
// Poprawki (kolumna `poprawki`) — zweryfikowane korekty nazwy/koloru/kategorii/modelu.
// Nakładane przy odczycie, więc codzienne scalanie z Allegro ich nie nadpisuje.
const KATEGORIE_OK = new Set(["dziewczynki", "chlopcy", "niemowleta", "dorosli"]);
function poprawki(r: any): {
  nazwa?: string;
  kolor?: string;
  kategoria?: string;
  model?: string;
  opisHtml?: string;
  opisRozmiary?: Record<string, string>;
} {
  const p = r?.poprawki;
  if (!p || typeof p !== "object") return {};
  const tekst = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const kat = tekst(p.kategoria);
  const rozm =
    p.opisRozmiary && typeof p.opisRozmiary === "object"
      ? Object.fromEntries(Object.entries(p.opisRozmiary as Record<string, unknown>).filter(([, v]) => typeof v === "string" && v.trim()))
      : null;
  return {
    nazwa: tekst(p.nazwa),
    kolor: tekst(p.kolor),
    kategoria: kat && KATEGORIE_OK.has(kat) ? kat : undefined,
    model: tekst(p.model),
    opisHtml: tekst(p.opisHtml),
    opisRozmiary: rozm && Object.keys(rozm).length ? (rozm as Record<string, string>) : undefined,
  };
}

function czysteOpisyRozmiarow(m: unknown): Record<string, string> {
  if (!m || typeof m !== "object") return {};
  return Object.fromEntries(Object.entries(m as Record<string, string>).map(([k, v]) => [k, oczyscHtmlOpisu(v) ?? ""]));
}

// Tekst z HTML opisu (wyszukiwarka, feed, zapasowy opis).
function tekstZHtml(h: string): string {
  return h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function zRzedu(r: any): Produkt {
  const pop = poprawki(r);
  // Kolejność zdjęć (własne zdjęcie koloru jako pierwsze) ustala scalanie.
  const zdjecia: string[] = r.zdjecia ?? [];
  return {
    id: r.id,
    nazwa: pop.nazwa ?? ladnaNazwa(r.nazwa), // schludny tytuł (bez KRZYKU, „cm", literówek) — spójnie wszędzie
    cena: Number(r.cena),
    kategoria: (pop.kategoria ?? r.kategoria) as Produkt["kategoria"],
    wiek: r.wiek,
    wiekLabel: r.wiek_label,
    badge: r.badge ?? null,
    rozmiary: r.rozmiary ?? [],
    zdjecie: zdjecia[0] ?? r.zdjecie ?? null,
    zdjecia,
    // Opis poprawiony w edytorze (poprawki) zastępuje opis z Allegro — także opisy per rozmiar.
    opis: pop.opisHtml ? tekstZHtml(pop.opisHtml) : oczyscTekstOpisu(r.opis), // bez „zobacz inne aukcje" i zepsutych znaków
    opisHtml: pop.opisHtml ?? oczyscHtmlOpisu(r.opis_html),
    // Opisy per rozmiar: poprawione w edytorze (pojedyncze rozmiary) nadpisują te z Allegro;
    // sam poprawiony opis bez rozmiarów (stary zapis) = jeden opis dla wszystkich.
    opisRozmiary: pop.opisRozmiary
      ? { ...czysteOpisyRozmiarow(r.opis_rozmiary), ...pop.opisRozmiary }
      : !pop.opisHtml && r.opis_rozmiary
      ? Object.fromEntries(Object.entries(r.opis_rozmiary as Record<string, string>).map(([k, v]) => [k, oczyscHtmlOpisu(v) ?? ""]))
      : null,
    kolor: pop.kolor ?? r.kolor ?? null,
    model: pop.model,
    stan: r.stan ?? undefined,
    stanRozmiary: r.stan_rozmiary ?? null,
    ukryty: !!r.ukryty,
    hue: r.hue ?? 30,
  };
}

export function doRzedu(p: Produkt): Record<string, unknown> {
  return {
    id: p.id,
    nazwa: p.nazwa,
    cena: p.cena,
    kategoria: p.kategoria,
    wiek: p.wiek,
    wiek_label: p.wiekLabel,
    badge: p.badge ?? null,
    rozmiary: p.rozmiary ?? [],
    zdjecie: p.zdjecie ?? null,
    zdjecia: p.zdjecia ?? [],
    opis: p.opis ?? null,
    opis_html: p.opisHtml ?? null,
    kolor: p.kolor ?? null,
    stan: p.stan ?? null,
    stan_rozmiary: p.stanRozmiary ?? null,
    ukryty: !!p.ukryty,
    hue: p.hue,
  };
}

// Kolumny do LIST — bez ciężkich pól (allegro_surowe = pełny JSON oferty,
// opis_html = pełny opis). Bez tego odpowiedź przy 1000+ produktach jest
// gigantyczna i się urywa. Ciężkie pola pobieramy tylko dla jednego produktu.
const KOLUMNY_KATALOG =
  "id, nazwa, cena, kategoria, wiek, wiek_label, badge, rozmiary, zdjecie, zdjecia, opis, kolor, stan, stan_rozmiary, ukryty, hue, created_at, poprawki";

/** Katalog widoczny w sklepie (bez wyłączonych ofert). */
export async function katalogWidoczny(): Promise<Produkt[]> {
  if (supabaseWlaczony()) {
    // Service role (serwerowo) — omija RLS/limity klucza anon, który zwracał tylko część wierszy.
    const sb = sbService() ?? sbAnon();
    if (sb) {
      const { data, error } = await sb.from("produkty").select(KOLUMNY_KATALOG).eq("ukryty", false).order("created_at", { ascending: true }).limit(5000);
      if (!error && data) return przypiszRodziny(data.map(zRzedu));
    }
  }
  return przypiszRodziny(PRODUKTY.filter((p) => !p.ukryty));
}

/** Pełny katalog (także wyłączone) — dla panelu. */
export async function katalogWszystko(): Promise<Produkt[]> {
  if (supabaseWlaczony()) {
    const sb = sbService() ?? sbAnon();
    if (sb) {
      const { data, error } = await sb.from("produkty").select(KOLUMNY_KATALOG).order("created_at", { ascending: true }).limit(5000);
      if (!error && data) return przypiszRodziny(data.map(zRzedu));
    }
  }
  return przypiszRodziny(PRODUKTY);
}

/** Opisy per rozmiar jako czysty tekst (feed Google/Meta: osobna pozycja na rozmiar). */
export async function opisyRozmiarowTekst(): Promise<Map<string, Record<string, string>>> {
  const wynik = new Map<string, Record<string, string>>();
  if (!supabaseWlaczony()) return wynik;
  const sb = sbService() ?? sbAnon();
  if (!sb) return wynik;
  const { data } = await sb.from("produkty").select("id, opis_rozmiary, poprawki").eq("ukryty", false).not("opis_rozmiary", "is", null).limit(5000);
  for (const r of data ?? []) {
    const pop = poprawki(r);
    if (pop.opisHtml && !pop.opisRozmiary) continue; // opis poprawiony w edytorze — jeden dla wszystkich rozmiarów
    const m: Record<string, string> = {};
    const zrodlo = { ...czysteOpisyRozmiarow(r.opis_rozmiary), ...(pop.opisRozmiary ?? {}) };
    for (const [roz, html] of Object.entries(zrodlo)) {
      const t = (html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      if (t) m[roz] = t;
    }
    if (Object.keys(m).length) wynik.set(r.id, m);
  }
  return wynik;
}

export async function znajdzProduktDb(id: string): Promise<Produkt | null> {
  if (supabaseWlaczony()) {
    const sb = sbService() ?? sbAnon();
    if (sb) {
      const { data } = await sb.from("produkty").select("*").eq("id", id).maybeSingle();
      if (data) return zRzedu(data);
    }
  }
  return PRODUKTY.find((p) => p.id === id) ?? null;
}
