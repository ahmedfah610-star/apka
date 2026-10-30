"use client";

// Zamówienia zalogowanego klienta (panel konta). Odczyt prosto z bazy — reguły RLS
// zwracają wyłącznie zamówienia złożone na e-mail zalogowanego klienta.

import { sbBrowser } from "@/lib/supabaseBrowser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PozycjaZamowienia {
  id: string;
  nazwa: string;
  cena?: number;
  ilosc: number;
  rozmiar?: string | null;
  kolor?: string | null;
  zdjecie?: string | null;
}

export interface ZamowienieKlienta {
  id: string;
  created_at: string;
  status: string;
  suma?: number;
  dostawa?: number;
  rabat?: number | null;
  kod_rabatowy?: string | null;
  razem: number;
  metoda: string | null;
  pozycje: PozycjaZamowienia[];
  klient?: Record<string, any> | null;
  numer_przesylki?: string | null;
  przewoznik?: string | null;
  wyslano_at?: string | null;
}

export const ETYKIETY: Record<string, string> = {
  nowe: "Przyjęte",
  oczekuje_na_platnosc: "Oczekuje na płatność",
  oplacone: "Opłacone",
  wyslane: "Wysłane",
  anulowane: "Anulowane",
};

export const KOLOR: Record<string, string> = {
  oplacone: "bg-[oklch(90%_0.07_150)] text-[oklch(42%_0.13_150)]",
  wyslane: "bg-[oklch(88%_0.02_250)] text-ink",
  anulowane: "bg-szary text-ink-2",
  oczekuje_na_platnosc: "bg-[oklch(92%_0.07_85)] text-[oklch(45%_0.12_75)]",
  nowe: "bg-[oklch(90%_0.05_250)] text-[oklch(40%_0.13_250)]",
};

export const zl = (n: number) => `${Number(n || 0).toFixed(2).replace(".", ",")} zł`;
export const dataPl = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
export const numer = (id: string) => id.slice(0, 8);

const POLA_LISTY = "id, created_at, status, razem, metoda, pozycje, numer_przesylki, przewoznik";
const POLA_SZCZEGOLOW =
  "id, created_at, status, suma, dostawa, rabat, kod_rabatowy, razem, metoda, pozycje, klient, numer_przesylki, przewoznik, wyslano_at";

export async function pobierzZamowienia(limit?: number): Promise<ZamowienieKlienta[]> {
  const sb = sbBrowser();
  if (!sb) return [];
  let q = sb.from("zamowienia").select(POLA_LISTY).order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data as ZamowienieKlienta[]) ?? [];
}

export async function pobierzZamowienie(id: string): Promise<ZamowienieKlienta | null> {
  const sb = sbBrowser();
  if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from("zamowienia").select(POLA_SZCZEGOLOW).eq("id", id).maybeSingle();
  return (data as ZamowienieKlienta) ?? null;
}

/** Adres dostawy w czytelnej postaci (paczkomat / punkt odbioru / adres). */
export function adresDostawy(k?: Record<string, any> | null): { etykieta: string; linie: string[] } {
  if (!k) return { etykieta: "Adres dostawy", linie: [] };
  if (k.paczkomat) return { etykieta: "Paczkomat", linie: [String(k.paczkomat), k.paczkomatOpis ? String(k.paczkomatOpis) : ""].filter(Boolean) };
  if (k.punkt) return { etykieta: "Punkt odbioru", linie: [k.punktOpis ? String(k.punktOpis) : String(k.punkt), k.miasto ? String(k.miasto) : ""].filter(Boolean) };
  return { etykieta: "Adres dostawy", linie: [k.adres, [k.kod, k.miasto].filter(Boolean).join(" ")].filter(Boolean).map(String) };
}

/**
 * Ponowna płatność za zamówienie oczekujące na zapłatę. Zwraca adres płatności
 * Przelewy24 albo komunikat błędu do pokazania klientowi.
 */
export async function dokonczPlatnosc(id: string): Promise<{ url?: string; blad?: string }> {
  try {
    const r = await fetch("/api/platnosc/ponow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = (await r.json().catch(() => ({}))) as { url?: string; blad?: string };
    return d.url ? { url: d.url } : { blad: d.blad || "Nie udało się rozpocząć płatności. Spróbuj ponownie." };
  } catch {
    return { blad: "Błąd połączenia. Spróbuj ponownie." };
  }
}
