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
    const { data } = await sb.from("produkty").select("id, opis, opis_html, kolor, rozmiary, allegro_surowe").not("allegro_surowe", "is", null).limit(1).maybeSingle();
    const o: any = data?.allegro_surowe;
    if (!o) return Response.json({ ok: false, blad: "Brak zapisanej surowej oferty" });
    const prod: any = Array.isArray(o?.productSet) && o.productSet[0]?.product ? o.productSet[0].product : null;
    const opisItem: any = (o?.description?.sections ?? []).flatMap((s: any) => s?.items ?? []).find((it: any) => it?.type === "TEXT");
    return Response.json({
      ok: true,
      // Co ZAPISANO w bazie:
      zapisane: {
        opis_len: (data?.opis ?? "").length,
        opis_html_len: (data?.opis_html ?? "").length,
        kolor: data?.kolor ?? null,
        rozmiary: data?.rozmiary ?? [],
      },
      // Pole treści TEXT w opisie (żeby potwierdzić nazwę pola):
      opisItemKlucze: opisItem ? Object.keys(opisItem) : null,
      // Parametry PRODUKTU (tu powinny być Kolor/Rozmiar/materiał):
      productKlucze: prod ? Object.keys(prod) : null,
      productParametry: prod?.parameters ? prod.parameters.map((p: any) => ({ name: p?.name, values: p?.values })).slice(0, 60) : null,
      // Tabela rozmiarów:
      sizeTable: o?.sizeTable ?? null,
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

  if (b.akcja === "wyczysc") {
    // Usuwa TYLKO produkty zaimportowane z Allegro (id zaczyna się od "al-").
    const sb = sbService();
    if (!sb) return Response.json({ ok: false, blad: "Brak bazy" }, { status: 500 });
    const { error, count } = await sb.from("produkty").delete({ count: "exact" }).like("id", "al-%");
    if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
    odswiezPoZmianieStanu();
    return Response.json({ ok: true, usunieto: count ?? 0 });
  }

  if (b.akcja === "wyczysc_wszystko") {
    // Usuwa WSZYSTKIE produkty (czysta karta). Wymaga potwierdzenia z panelu.
    const sb = sbService();
    if (!sb) return Response.json({ ok: false, blad: "Brak bazy" }, { status: 500 });
    const { error, count } = await sb.from("produkty").delete({ count: "exact" }).not("id", "is", null);
    if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
    odswiezPoZmianieStanu();
    return Response.json({ ok: true, usunieto: count ?? 0 });
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
