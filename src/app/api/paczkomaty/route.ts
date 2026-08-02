// Pobiera paczkomaty InPost z publicznego API ShipX (bez tokenu).
// Wołane z przeglądarki jako /api/paczkomaty?q=<miasto> — bez problemów CORS.

interface PunktInPost {
  name: string;
  address?: { line1?: string; line2?: string };
  location_description?: string | null;
  address_details?: { city?: string };
}

export const revalidate = 3600;

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ items: [] });

  const url =
    `https://api-shipx-pl.easypack24.net/v1/points?type=parcel_locker&status=Operating` +
    `&city=${encodeURIComponent(q)}&per_page=60`;

  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return Response.json({ items: [] });
    const dane = (await r.json()) as { items?: PunktInPost[] };
    const items = (dane.items ?? []).map((p) => ({
      kod: p.name,
      miasto: p.address_details?.city ?? "",
      opis: [p.address?.line1, p.location_description].filter(Boolean).join(" · "),
    }));
    return Response.json({ items });
  } catch {
    return Response.json({ items: [] });
  }
}
