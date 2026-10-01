import { pobierzDostawe } from "@/lib/dostawaDb";

export const dynamic = "force-dynamic";

// Publiczny odczyt metod dostawy (koszyk, zamówienie) — ceny i opisy ustawione w trybie admina.
export async function GET() {
  return Response.json(await pobierzDostawe(), { headers: { "Cache-Control": "no-store" } });
}
