import { stripeWlaczony } from "@/lib/platnosci";
import { p24Wlaczony } from "@/lib/przelewy24";

export const dynamic = "force-dynamic";

// Publiczne flagi konfiguracji (bez sekretów) — do dostosowania UI.
export async function GET() {
  return Response.json({ platnosci: p24Wlaczony() || stripeWlaczony() });
}
