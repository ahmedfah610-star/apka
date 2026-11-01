import { pobierzDostawe } from "@/lib/dostawaDb";

// Publiczny odczyt metod dostawy (listy produktów, koszyk, zamówienie) — z pamięci podręcznej
// Vercela; zapis w panelu (api/admin/dostawa) odświeża ją od razu.
export const revalidate = 600;

export async function GET() {
  return Response.json(await pobierzDostawe());
}
