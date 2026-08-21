import { czyAdmin } from "@/lib/adminAuth";
import { allegroSkonfigurowany, czyPolaczony, rozpocznijDevice, sprawdzDevice } from "@/lib/allegro";
import { importujWszystko } from "@/lib/allegroImport";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Status połączenia z Allegro.
export async function GET() {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  return Response.json({
    ok: true,
    skonfigurowany: allegroSkonfigurowany(),
    polaczony: await czyPolaczony(),
  });
}

// Akcje: start (device flow), poll (sprawdź autoryzację), import (pobierz oferty).
export async function POST(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { akcja?: string; deviceCode?: string; tylkoAktywne?: boolean };

  if (b.akcja === "start") {
    const r = await rozpocznijDevice();
    if (!r.ok || !r.dane) return Response.json({ ok: false, blad: r.blad }, { status: 400 });
    return Response.json({
      ok: true,
      deviceCode: r.dane.device_code,
      userCode: r.dane.user_code,
      link: r.dane.verification_uri_complete,
      interval: r.dane.interval,
      wygasa: r.dane.expires_in,
    });
  }

  if (b.akcja === "poll") {
    if (!b.deviceCode) return Response.json({ ok: false, blad: "Brak device_code" }, { status: 400 });
    const r = await sprawdzDevice(b.deviceCode);
    return Response.json(r);
  }

  if (b.akcja === "import") {
    const r = await importujWszystko(b.tylkoAktywne !== false);
    if (r.ok) odswiezPoZmianieStanu();
    return Response.json(r, { status: r.ok ? 200 : 500 });
  }

  return Response.json({ ok: false, blad: "Nieznana akcja" }, { status: 400 });
}
