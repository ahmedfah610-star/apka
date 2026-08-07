import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Przeglądarkowy klient Supabase (Auth) — jedna instancja, trzyma sesję.
// Używa wyłącznie publicznego klucza anon. Gdy brak env — zwraca null
// (logowanie wyłączone, strony degradują się łagodnie).

let klient: SupabaseClient | null | undefined;

export function sbBrowser(): SupabaseClient | null {
  if (klient !== undefined) return klient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    klient = null;
    return klient;
  }
  klient = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return klient;
}

export function authWlaczony(): boolean {
  return sbBrowser() !== null;
}
