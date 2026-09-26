import { PRODUKTY, type Produkt } from "@/data/produkty";
import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";
import { ladnaNazwa } from "@/lib/nazwa";
import { oczyscHtmlOpisu, oczyscTekstOpisu } from "@/lib/opis";

// Warstwa danych produktów. Gdy Supabase jest skonfigurowany — czyta z bazy.
// Bez konfiguracji — fallback do katalogu z kodu (238 produktów), więc sklep
// działa zawsze, a po podłączeniu bazy przełącza się automatycznie.

/* eslint-disable @typescript-eslint/no-explicit-any */
function zRzedu(r: any): Produkt {
  // Kolejność zdjęć (zdjęcie w kolorze wariantu jako pierwsze) ustala scalanie
  // na podstawie analizy obrazu (tabela zdjecia_kolory).
  const zdjecia: string[] = r.zdjecia ?? [];
  return {
    id: r.id,
    nazwa: ladnaNazwa(r.nazwa), // schludny tytuł (bez KRZYKU, „cm", literówek) — spójnie wszędzie
    cena: Number(r.cena),
    kategoria: r.kategoria,
    wiek: r.wiek,
    wiekLabel: r.wiek_label,
    badge: r.badge ?? null,
    rozmiary: r.rozmiary ?? [],
    zdjecie: zdjecia[0] ?? r.zdjecie ?? null,
    zdjecia,
    opis: oczyscTekstOpisu(r.opis), // bez „zobacz inne aukcje" i zepsutych znaków
    opisHtml: oczyscHtmlOpisu(r.opis_html),
    opisRozmiary: r.opis_rozmiary
      ? Object.fromEntries(Object.entries(r.opis_rozmiary as Record<string, string>).map(([k, v]) => [k, oczyscHtmlOpisu(v) ?? ""]))
      : null,
    kolor: r.kolor ?? null,
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
  "id, nazwa, cena, kategoria, wiek, wiek_label, badge, rozmiary, zdjecie, zdjecia, opis, kolor, stan, stan_rozmiary, ukryty, hue, created_at";

/** Katalog widoczny w sklepie (bez wyłączonych ofert). */
export async function katalogWidoczny(): Promise<Produkt[]> {
  if (supabaseWlaczony()) {
    // Service role (serwerowo) — omija RLS/limity klucza anon, który zwracał tylko część wierszy.
    const sb = sbService() ?? sbAnon();
    if (sb) {
      const { data, error } = await sb.from("produkty").select(KOLUMNY_KATALOG).eq("ukryty", false).order("created_at", { ascending: true }).limit(5000);
      if (!error && data) return data.map(zRzedu);
    }
  }
  return PRODUKTY.filter((p) => !p.ukryty);
}

/** Pełny katalog (także wyłączone) — dla panelu. */
export async function katalogWszystko(): Promise<Produkt[]> {
  if (supabaseWlaczony()) {
    const sb = sbService() ?? sbAnon();
    if (sb) {
      const { data, error } = await sb.from("produkty").select(KOLUMNY_KATALOG).order("created_at", { ascending: true }).limit(5000);
      if (!error && data) return data.map(zRzedu);
    }
  }
  return PRODUKTY;
}

/** Opisy per rozmiar jako czysty tekst (feed Google/Meta: osobna pozycja na rozmiar). */
export async function opisyRozmiarowTekst(): Promise<Map<string, Record<string, string>>> {
  const wynik = new Map<string, Record<string, string>>();
  if (!supabaseWlaczony()) return wynik;
  const sb = sbService() ?? sbAnon();
  if (!sb) return wynik;
  const { data } = await sb.from("produkty").select("id, opis_rozmiary").eq("ukryty", false).not("opis_rozmiary", "is", null).limit(5000);
  for (const r of data ?? []) {
    const m: Record<string, string> = {};
    for (const [roz, html] of Object.entries((r.opis_rozmiary ?? {}) as Record<string, string>)) {
      const t = (oczyscHtmlOpisu(html) ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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
