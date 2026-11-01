import { revalidatePath, revalidateTag } from "next/cache";
import { TAG_KATALOGU } from "@/lib/produktyDb";

// Powyżej tylu zmienionych produktów taniej jest odświeżyć wszystkie karty naraz.
const MAX_POJEDYNCZO = 60;

/** Po zmianie stanów/produktów: świeży katalog od razu, a z kart produktów — tylko te zmienione
 *  (gdy znamy ich id). Odświeżenie wszystkich 1300+ kart przy każdym zamówieniu kosztowało
 *  tyle, że roboty Google przeliczały cały sklep od nowa. */
export function odswiezPoZmianieStanu(idProduktow?: string[]) {
  try {
    revalidateTag(TAG_KATALOGU); // wspólny katalog (karty, listy, /api/katalog)
    revalidatePath("/api/katalog");
    const ids = [...new Set((idProduktow ?? []).filter(Boolean))];
    if (idProduktow && ids.length <= MAX_POJEDYNCZO) {
      for (const id of ids) revalidatePath(`/produkty/${id}`);
    } else {
      revalidatePath("/produkty/[id]", "page"); // wszystkie karty produktów
    }
    revalidatePath("/produkty");
    revalidatePath("/");
  } catch {
    /* revalidatePath działa tylko w kontekście żądania — ignorujemy błędy */
  }
}

/** Id produktów z pozycji zamówienia (kolumna jsonb `pozycje`). */
export function idZPozycji(pozycje: unknown): string[] {
  return Array.isArray(pozycje) ? pozycje.map((p) => String((p as { id?: unknown })?.id ?? "")).filter(Boolean) : [];
}
