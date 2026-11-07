// Pytania klientów o produkt („Masz pytanie o ten produkt?" na karcie produktu).
// Bez nowej tabeli: każde pytanie to wpis w `ustawienia` (klucz „pytanie:<czas>-<los>"),
// tabela niedostępna publicznie (RLS) — czyta i pisze tylko serwer. Załatwione pytania starsze
// niż 180 dni są sprzątane, żeby nie rosła baza (darmowy plan Supabase).

import type { SupabaseClient } from "@supabase/supabase-js";

export const PREFIKS_PYTANIA = "pytanie:";
const RETENCJA_DNI = 180;

export type StatusPytania = "nowe" | "odpowiedziane" | "zalatwione";

export interface Pytanie {
  id: string; // = klucz w tabeli
  produktId: string;
  nazwa: string;
  zdjecie: string | null;
  cena: number;
  rozmiar: string | null;
  email: string;
  tresc: string;
  czas: string;
  status: StatusPytania;
  odpowiedz?: string;
  odpowiedzCzas?: string;
}

export const MAX_TRESC = 1500;
export const MIN_TRESC = 5;
export const MAX_ODPOWIEDZ = 4000;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

/** Szybkie pytania do kliknięcia w oknie — wstawiają początek treści. */
export const SZYBKIE_PYTANIA = [
  { etykieta: "Jaki rozmiar wybrać?", tekst: "Dzień dobry, jaki rozmiar wybrać? Dziecko ma … miesięcy i … cm wzrostu." },
  { etykieta: "Wymiary", tekst: "Dzień dobry, jakie są dokładne wymiary (długość, szerokość) w rozmiarze …?" },
  { etykieta: "Czy będzie inny rozmiar?", tekst: "Dzień dobry, czy ten produkt będzie dostępny w rozmiarze …?" },
  { etykieta: "Kiedy wyślecie?", tekst: "Dzień dobry, kiedy wyślecie zamówienie, jeśli zamówię dzisiaj?" },
];

const czysc = (s: unknown, max: number) =>
  typeof s === "string"
    ? s
        .replace(/[<>]/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .trim()
        .slice(0, max)
    : "";

export interface DanePytania {
  produktId: string;
  rozmiar: string | null;
  email: string;
  tresc: string;
}

/** Walidacja zgłoszenia z formularza. `pulapka` = ukryte pole — wypełniają je tylko boty. */
export function sprawdzPytanie(we: unknown): { ok: true; dane: DanePytania; bot?: boolean } | { ok: false; blad: string } {
  const z = (we ?? {}) as Record<string, unknown>;
  if (typeof z.www === "string" && z.www.trim()) return { ok: true, bot: true, dane: { produktId: "", rozmiar: null, email: "", tresc: "" } };
  const produktId = czysc(z.produktId, 80);
  const email = czysc(z.email, 160).toLowerCase();
  const tresc = czysc(z.tresc, MAX_TRESC);
  const rozmiar = czysc(z.rozmiar, 20) || null;
  if (!/^[a-z0-9-]{2,80}$/i.test(produktId)) return { ok: false, blad: "Nieznany produkt." };
  if (tresc.length < MIN_TRESC) return { ok: false, blad: "Napisz, o co chcesz zapytać." };
  if (!EMAIL.test(email)) return { ok: false, blad: "Podaj poprawny adres e-mail — na niego odpiszemy." };
  return { ok: true, dane: { produktId, rozmiar, email, tresc } };
}

export function nowyKlucz(teraz = new Date()): string {
  return `${PREFIKS_PYTANIA}${teraz.toISOString()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function zapiszPytanie(sb: SupabaseClient, p: Omit<Pytanie, "id">, klucz = nowyKlucz(new Date(p.czas))): Promise<Pytanie> {
  const { error } = await sb.from("ustawienia").insert({ klucz, wartosc: p, zaktualizowano: new Date().toISOString() });
  if (error) throw new Error(error.message);
  // Sprzątanie od czasu do czasu: tylko załatwione/odpowiedziane, starsze niż 180 dni.
  if (Math.random() < 0.1) {
    const granica = PREFIKS_PYTANIA + new Date(Date.now() - RETENCJA_DNI * 86400000).toISOString();
    await sb.from("ustawienia").delete().like("klucz", `${PREFIKS_PYTANIA}%`).lt("klucz", granica).neq("wartosc->>status", "nowe");
  }
  return { id: klucz, ...p };
}

export async function listaPytan(sb: SupabaseClient): Promise<Pytanie[]> {
  const { data, error } = await sb
    .from("ustawienia")
    .select("klucz, wartosc")
    .like("klucz", `${PREFIKS_PYTANIA}%`)
    .order("klucz", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { klucz: string; wartosc: Omit<Pytanie, "id"> }) => ({ ...r.wartosc, id: r.klucz }));
}

export async function pobierzPytanie(sb: SupabaseClient, id: string): Promise<Pytanie | null> {
  if (!id.startsWith(PREFIKS_PYTANIA) || id.length > 80) return null;
  const { data } = await sb.from("ustawienia").select("klucz, wartosc").eq("klucz", id).maybeSingle();
  return data ? { ...(data.wartosc as Omit<Pytanie, "id">), id: data.klucz } : null;
}

export async function zmienPytanie(sb: SupabaseClient, p: Pytanie, zmiany: Partial<Omit<Pytanie, "id">>): Promise<Pytanie> {
  const { id, ...reszta } = p;
  const wartosc = { ...reszta, ...zmiany };
  const { error } = await sb.from("ustawienia").update({ wartosc, zaktualizowano: new Date().toISOString() }).eq("klucz", id);
  if (error) throw new Error(error.message);
  return { id, ...wartosc };
}

export function liczbaNowych(lista: Pick<Pytanie, "status">[]): number {
  return lista.filter((p) => p.status === "nowe").length;
}
