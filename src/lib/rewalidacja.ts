import { revalidatePath } from "next/cache";

// Po zmianie stanów magazynowych (sprzedaż) odświeżamy strony cache'owane ISR,
// żeby dostępność i liczba sztuk były aktualne od razu, a nie po 5 minutach.
export function odswiezPoZmianieStanu() {
  try {
    revalidatePath("/produkty/[id]", "page"); // wszystkie karty produktów
    revalidatePath("/produkty");
    revalidatePath("/");
  } catch {
    /* revalidatePath działa tylko w kontekście żądania — ignorujemy błędy */
  }
}
