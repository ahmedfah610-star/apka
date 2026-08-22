import { przypomnijKoszyki } from "@/lib/koszykCron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ręczne/awaryjne uruchomienie przypomnień o porzuconym koszyku.
// Na planie Hobby nie ma osobnego crona — logika odpala się z crona „opinie".
export async function GET(req: Request) {
  const sekret = process.env.CRON_SECRET;
  if (!sekret) return Response.json({ ok: false, powod: "brak_CRON_SECRET" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${sekret}`) {
    return Response.json({ ok: false, powod: "brak_dostepu" }, { status: 401 });
  }
  return Response.json(await przypomnijKoszyki());
}
