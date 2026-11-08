import { czyAdmin } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { kontaKlientow, KOD_POWITALNY, zgodaZKonta, moznaWyslacRecznie } from "@/lib/kodPowitalny";
import { wyslijKodPowitalny } from "@/lib/kodPowitalnyWysylka";

export const dynamic = "force-dynamic";

// Panel → Klienci → Nowe konta: lista kont (kto kupił, komu poszedł kod powitalny)
// i ręczna wysyłka kodu NOWY5.
export async function GET() {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  try {
    return Response.json({ ok: true, kod: KOD_POWITALNY, items: await kontaKlientow(sb) });
  } catch (e) {
    return Response.json({ ok: false, blad: e instanceof Error ? e.message : "Błąd." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const b = (await req.json().catch(() => ({}))) as { id?: unknown };
  const id = String(b.id ?? "");
  if (!id) return Response.json({ ok: false, blad: "Brak konta." }, { status: 400 });
  const { data, error } = await sb.auth.admin.getUserById(id);
  const u = data?.user;
  if (error || !u?.email) return Response.json({ ok: false, blad: "Nie znaleziono konta." }, { status: 404 });
  if (!moznaWyslacRecznie(zgodaZKonta(u.user_metadata))) {
    return Response.json({ ok: false, blad: "Klient nie zaznaczył zgody na kody i nowości — nie wysyłamy." }, { status: 403 });
  }
  const w = await wyslijKodPowitalny(sb, { id: u.id, email: u.email.toLowerCase(), imie: String(u.user_metadata?.imie ?? "") });
  if (!w.ok) return Response.json({ ok: false, blad: w.blad || "Nie udało się wysłać." }, { status: 502 });
  return Response.json({ ok: true, czas: w.czas });
}
