import { czyAdmin } from "@/lib/adminAuth";
import { allegroSkonfigurowany, czyPolaczony, rozpocznijDevice, sprawdzDevice } from "@/lib/allegro";
import { importujStrone } from "@/lib/allegroImport";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";
import { sbService } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // limit planu Hobby

/* eslint-disable @typescript-eslint/no-explicit-any */

// Status połączenia z Allegro. ?probka=1 → kształt jednej zapisanej oferty (diagnostyka).
export async function GET(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("probka")) {
    const sb = sbService();
    if (!sb) return Response.json({ ok: false, blad: "Brak bazy" });
    const { data } = await sb.from("produkty").select("id, allegro_surowe").not("allegro_surowe", "is", null).limit(1).maybeSingle();
    const o: any = data?.allegro_surowe;
    if (!o) return Response.json({ ok: false, blad: "Brak zapisanej surowej oferty" });
    const opisSekcje = o?.description?.sections;
    return Response.json({
      ok: true,
      klucze: Object.keys(o),
      maParametry: Array.isArray(o?.parameters),
      parametry: (o?.parameters ?? []).map((p: any) => ({ name: p?.name, values: p?.values, valuesIds: p?.valuesIds })).slice(0, 40),
      opisIstnieje: !!o?.description,
      opisSekcjeLiczba: Array.isArray(opisSekcje) ? opisSekcje.length : null,
      opisTypy: Array.isArray(opisSekcje) ? opisSekcje.flatMap((s: any) => (s?.items ?? []).map((it: any) => it?.type)) : null,
      maProduct: !!o?.product,
      maProductSet: Array.isArray(o?.productSet),
      klucze_product: o?.product ? Object.keys(o.product) : null,
      klucze_productSet0: Array.isArray(o?.productSet) && o.productSet[0] ? Object.keys(o.productSet[0]) : null,
    });
  }
  return Response.json({
    ok: true,
    skonfigurowany: allegroSkonfigurowany(),
    polaczony: await czyPolaczony(),
  });
}

// Akcje: start (device flow), poll (sprawdź autoryzację), import (pobierz oferty).
export async function POST(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { akcja?: string; deviceCode?: string; tylkoAktywne?: boolean; offset?: number };

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
    // Import porcjami — panel woła w pętli ze zwiększanym offsetem (limit Hobby 60 s).
    const offset = Math.max(0, Number(b.offset) || 0);
    const r = await importujStrone(offset, 8, b.tylkoAktywne !== false);
    if (r.ok && r.zapisano > 0) odswiezPoZmianieStanu();
    return Response.json(r, { status: r.ok ? 200 : 500 });
  }

  return Response.json({ ok: false, blad: "Nieznana akcja" }, { status: 400 });
}
