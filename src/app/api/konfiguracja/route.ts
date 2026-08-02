import { stripeWlaczony } from "@/lib/platnosci";

export const dynamic = "force-dynamic";

// Publiczne flagi konfiguracji (bez sekretów) — do dostosowania UI.
export async function GET() {
  return Response.json({ platnosci: stripeWlaczony() });
}
