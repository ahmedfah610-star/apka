// Pobiera paczkomaty InPost z publicznego API ShipX (bez tokenu).
// Wołane z przeglądarki jako /api/paczkomaty?q=<miasto> — bez problemów CORS.

interface PunktInPost {
  name: string;
  address?: { line1?: string; line2?: string };
  location_description?: string | null;
  address_details?: { city?: string };
}

export const revalidate = 3600;

/** InPost wymaga nazwy miasta z wielkiej litery ("Warszawa", "Nowy Sącz"). */
function normalizujMiasto(s: string): string {
  return s.toLocaleLowerCase("pl").replace(/\p{L}+/gu, (w) => w[0].toLocaleUpperCase("pl") + w.slice(1));
}

export async function GET(req: Request) {
  const surowe = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (surowe.length < 2) return Response.json({ items: [] });
  const q = normalizujMiasto(surowe);

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
