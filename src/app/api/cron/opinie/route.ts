import { sbService } from "@/lib/supabase";
import { wyslijMailProsbaOOpinie, mailWlaczony } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Codzienna prośba o opinię: zamówienia opłacone/wysłane sprzed 7–30 dni,
// którym jeszcze nie wysłano prośby. Chroniony CRON_SECRET (Vercel Cron).
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  if (!mailWlaczony()) return Response.json({ ok: false, powod: "brak_maili" }, { status: 503 });

  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 503 });

  const od = new Date(Date.now() - 30 * 86400000).toISOString();
  const doD = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data, error } = await sb
    .from("zamowienia")
    .select("id, klient, pozycje, created_at, status, opinia_wyslana")
    .in("status", ["oplacone", "wyslane"])
    .gte("created_at", od)
    .lte("created_at", doD)
    .or("opinia_wyslana.is.null,opinia_wyslana.eq.false")
    .limit(100);

  if (error) {
    // Najczęściej: brak kolumny opinia_wyslana — trzeba uruchomić migrację.
    return Response.json({ ok: false, powod: "blad_zapytania", szczegoly: error.message }, { status: 500 });
  }

  let wyslano = 0;
  for (const z of (data ?? []) as any[]) {
    const email = z.klient?.email;
    if (!email) continue;
    const widziane = new Set<string>();
    const produkty = (z.pozycje ?? [])
      .filter((p: any) => p?.id && !widziane.has(p.id) && widziane.add(p.id))
      .map((p: any) => ({ id: String(p.id), nazwa: String(p.nazwa ?? "Produkt") }));
    if (produkty.length === 0) continue;

    await wyslijMailProsbaOOpinie({ id: z.id, email, imie: z.klient?.imie, produkty });
    await sb.from("zamowienia").update({ opinia_wyslana: true }).eq("id", z.id);
    wyslano++;
  }

  return Response.json({ ok: true, wyslano, sprawdzono: data?.length ?? 0 });
}
