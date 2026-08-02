import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
