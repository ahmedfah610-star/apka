import { katalogWidoczny } from "@/lib/produktyDb";

// Katalog dla przeglądarki (koszyk, ulubione, wyszukiwarka, listy) — ~1,2 MB.
// Serwowany z pamięci podręcznej Vercela i odświeżany co godzinę albo od razu po zmianie stanów
// (lib/rewalidacja). Wcześniej był liczony od nowa przy każdym wejściu na stronę — główne
// źródło zużycia CPU.
export const revalidate = 3600;

export async function GET() {
  return Response.json({ items: await katalogWidoczny() });
}
