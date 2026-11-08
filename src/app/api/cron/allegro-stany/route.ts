import { synchronizujStany } from "@/lib/allegroStany";
import { automatycznePrzypomnienia } from "@/lib/przypomnieniaPlatnosci";
import { sbService } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Codzienna synchronizacja ilości z Allegro (Vercel Cron, chroniony CRON_SECRET).
// Wynik zapisywany w ustawienia/allegro_stany — widoczny w panelu „Import z Allegro".
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  const r = await synchronizujStany({ zrodlo: "codzienna" });
  // Przy okazji (wieczorem): przypomnienia o niedokończonej płatności — rano idą z crona „opinie".
  const sb = sbService();
  const przypomnienia = sb ? await automatycznePrzypomnienia(sb) : { ok: false };
  return Response.json({ ...r, przypomnienia }, { status: r.ok ? 200 : 500 });
}
