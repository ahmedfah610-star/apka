import { czyAdmin } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { wyslijMailWyslano } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Lista zamówień — panel (statystyki + obsługa). Składanie zamówień: /api/platnosc/checkout.
export async function GET() {
  if (!czyAdmin()) return Response.json({ items: [] }, { status: 401 });
  if (!supabaseWlaczony()) return Response.json({ items: [] });
  const sb = sbService();
  if (!sb) return Response.json({ items: [] });
  const { data, error } = await sb.from("zamowienia").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) return Response.json({ items: [] });
  const items = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    data: r.created_at,
    pozycje: r.pozycje,
    suma: Number(r.suma),
    dostawa: Number(r.dostawa),
    razem: Number(r.razem),
    metoda: r.metoda,
    klient: r.klient ?? {},
    status: r.status ?? "nowe",
    numerPrzesylki: r.numer_przesylki ?? null,
    przewoznik: r.przewoznik ?? null,
  }));
  return Response.json({ items });
}

const DOZWOLONE = ["nowe", "oczekuje_na_platnosc", "oplacone", "wyslane", "anulowane"];

// Zmiana statusu i/lub danych wysyłki zamówienia.
// Gdy status → "wyslane" i mamy adres e-mail — wysyłamy powiadomienie z trackingiem.
export async function PATCH(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, powod: "brak_bazy" }, { status: 501 });
  const body = (await req.json()) as {
    id: string;
    status?: string;
    numerPrzesylki?: string | null;
    przewoznik?: string | null;
    powiadom?: boolean;
  };
  const { id } = body;
  if (!id) return Response.json({ ok: false, blad: "Brak id" }, { status: 400 });

  const zmiany: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!DOZWOLONE.includes(body.status)) return Response.json({ ok: false, blad: "Zły status" }, { status: 400 });
    zmiany.status = body.status;
    if (body.status === "wyslane") zmiany.wyslano_at = new Date().toISOString();
  }
  if (body.numerPrzesylki !== undefined) zmiany.numer_przesylki = (body.numerPrzesylki || "").trim() || null;
  if (body.przewoznik !== undefined) zmiany.przewoznik = body.przewoznik || null;
  if (Object.keys(zmiany).length === 0) return Response.json({ ok: false, blad: "Brak zmian" }, { status: 400 });

  const { data, error } = await sb.from("zamowienia").update(zmiany).eq("id", id).select("*").single();
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  // Powiadomienie o wysyłce: gdy oznaczono „wysłane" (lub jawnie poproszono).
  let mail: { ok: boolean; blad?: string } | undefined;
  const chceMail = body.powiadom || zmiany.status === "wyslane";
  if (chceMail && data) {
    const klient = (data.klient ?? {}) as { email?: string; imie?: string };
    if (klient.email) {
      mail = await wyslijMailWyslano({
        id: String(data.id),
        email: klient.email,
        imie: klient.imie,
        przewoznik: data.przewoznik,
        numer: data.numer_przesylki,
      });
    }
  }
  return Response.json({ ok: true, mail });
}
