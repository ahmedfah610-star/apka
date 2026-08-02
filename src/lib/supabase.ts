import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Normalizacja adresu: usuń spacje, końcowy slash i przypadkowo doklejone
// ścieżki (np. gdy ktoś wklei link do dashboardu zamiast adresu API).
function normalizujUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let u = raw.trim().replace(/\/+$/, "");
  // Zostaw tylko https://<ref>.supabase.co (obetnij ewentualną ścieżkę).
  const m = u.match(/^https?:\/\/[^/]+/);
  if (m) u = m[0];
  return u;
}

const URL = normalizujUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** Czy baza jest skonfigurowana (są klucze). */
export function supabaseWlaczony(): boolean {
  return !!(URL && (SERVICE || ANON));
}

/** Klient publiczny (odczyt zgodny z RLS). */
export function sbAnon(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

/** Klient serwerowy (service role — pełny dostęp; NIGDY nie używać w przeglądarce). */
export function sbService(): SupabaseClient | null {
  if (!URL || !SERVICE) return null;
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}
