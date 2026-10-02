import { timingSafeEqual } from "crypto";
import { sbService } from "@/lib/supabase";

// Zamówienia testowe (sprawdzenie całej ścieżki bez płatności). Płatności dla klientów
// zostają włączone — pominąć je może tylko żądanie z jednorazowym kluczem zapisanym
// w ustawienia/zamowienia_testowe, ważnym do podanej godziny.
export async function kluczTestowyOk(klucz: unknown): Promise<boolean> {
  if (typeof klucz !== "string" || klucz.length < 32) return false;
  const sb = sbService();
  if (!sb) return false;
  const { data } = await sb.from("ustawienia").select("wartosc").eq("klucz", "zamowienia_testowe").maybeSingle();
  const w = (data?.wartosc ?? null) as { klucz?: string; wygasa?: string } | null;
  if (!w?.klucz || !w.wygasa || new Date(w.wygasa).getTime() < Date.now()) return false;
  const a = Buffer.from(w.klucz);
  const b = Buffer.from(klucz);
  return a.length === b.length && timingSafeEqual(a, b);
}
