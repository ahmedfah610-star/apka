import { opinieAllegro } from "@/lib/opinieAllegro";

// Podsumowanie opinii z Allegro dla stron w przeglądarce (zamówienie) — z pamięci podręcznej Vercela.
export const revalidate = 3600;

export async function GET() {
  const d = await opinieAllegro().catch(() => null);
  return Response.json({ podsumowanie: d?.podsumowanie ?? null });
}
