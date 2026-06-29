import type { TypUslugodawcy, Uslugodawca } from "@/types/domain";
import { USLUGODAWCY } from "@/data/uslugodawcy";

// Warstwa serwisowa weterynarzy/fryzjerów. Na etapie 1 czyta z lokalnego seeda.
// Docelowo zostanie podmieniona na zapytanie do tabeli `providers` w Supabase
// (zasilanej np. z Google Places + opiniami użytkowników mojaŁapy) — sygnatura
// funkcji (miasto, typ) -> Uslugodawca[] ma się nie zmieniać.
export async function fetchProviders(miasto: string, typ: TypUslugodawcy): Promise<Uslugodawca[]> {
  return USLUGODAWCY.filter((u) => u.miasto === miasto && u.typ === typ);
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
