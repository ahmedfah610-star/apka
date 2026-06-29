import type { TypUslugodawcy, Uslugodawca } from "@/types/domain";

// Warstwa serwisowa weterynarzy/fryzjerów. Woła własny endpoint /api/specjalisci,
// który po stronie serwera pyta Google Places API (klucz nigdy nie trafia do przeglądarki).
// Gdy klucz Google nie jest skonfigurowany, endpoint zwraca dane demo — fetchProviders
// o tym nie wie, więc podmiana źródła w przyszłości (np. na Supabase) nie wymaga zmian tutaj.
export interface WynikProviders {
  source: "google" | "demo";
  wyniki: Uslugodawca[];
}

export async function fetchProviders(miasto: string, typ: TypUslugodawcy): Promise<WynikProviders> {
  const params = new URLSearchParams({ miasto, typ });
  const odpowiedz = await fetch(`/api/specjalisci?${params.toString()}`);
  const dane = (await odpowiedz.json()) as WynikProviders;
  return { source: dane.source ?? "demo", wyniki: dane.wyniki ?? [] };
}

/**
 * Ranking ważony: sama wysoka ocena z 2 opiniami nie powinna wygrywać z bardzo wysoką
 * oceną popartą setkami opinii. Im więcej opinii, tym bliżej realnej oceny średniej.
 */
export function rankingPoOpiniach(lista: Uslugodawca[]): Uslugodawca[] {
  return [...lista].sort((a, b) => {
    const wagaA = a.ocenaSrednia * Math.log10(a.liczbaOpinii + 10);
    const wagaB = b.ocenaSrednia * Math.log10(b.liczbaOpinii + 10);
    return wagaB - wagaA;
  });
}
