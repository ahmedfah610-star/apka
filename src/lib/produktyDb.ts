import { PRODUKTY, type Produkt } from "@/data/produkty";
import { sbAnon, sbService, supabaseWlaczony } from "@/lib/supabase";

// Warstwa danych produktów. Gdy Supabase jest skonfigurowany — czyta z bazy.
// Bez konfiguracji — fallback do katalogu z kodu (238 produktów), więc sklep
// działa zawsze, a po podłączeniu bazy przełącza się automatycznie.

/* eslint-disable @typescript-eslint/no-explicit-any */
function zRzedu(r: any): Produkt {
  return {
    id: r.id,
    nazwa: r.nazwa,
    cena: Number(r.cena),
    kategoria: r.kategoria,
    wiek: r.wiek,
    wiekLabel: r.wiek_label,
    badge: r.badge ?? null,
    rozmiary: r.rozmiary ?? [],
    zdjecie: r.zdjecie ?? null,
    zdjecia: r.zdjecia ?? [],
    opis: r.opis ?? undefined,
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
    kolor: p.kolor ?? null,
    stan: p.stan ?? null,
    stan_rozmiary: p.stanRozmiary ?? null,
    ukryty: !!p.ukryty,
    hue: p.hue,
  };
}

/** Katalog widoczny w sklepie (bez wyłączonych ofert). */
export async function katalogWidoczny(): Promise<Produkt[]> {
  if (supabaseWlaczony()) {
    const sb = sbAnon() ?? sbService();
    if (sb) {
      const { data, error } = await sb.from("produkty").select("*").eq("ukryty", false).order("created_at", { ascending: true });
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
      const { data, error } = await sb.from("produkty").select("*").order("created_at", { ascending: true });
      if (!error && data) return data.map(zRzedu);
    }
  }
  return PRODUKTY;
}

export async function znajdzProduktDb(id: string): Promise<Produkt | null> {
  if (supabaseWlaczony()) {
    const sb = sbAnon() ?? sbService();
    if (sb) {
      const { data } = await sb.from("produkty").select("*").eq("id", id).maybeSingle();
      if (data) return zRzedu(data);
    }
  }
  return PRODUKTY.find((p) => p.id === id) ?? null;
}
