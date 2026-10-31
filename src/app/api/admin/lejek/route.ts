import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { katalogWszystko } from "@/lib/produktyDb";
import { PREFIKS, agregujLejek, dzien, type DzienLicznika } from "@/lib/licznik";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Lejek na produkt: wejścia → dodania do koszyka → zakupy (opłacone/wysłane, bez TEST, bez braków/zwrotów).
export async function GET(req: Request) {
  if (!czyAdmin()) return odmowa();
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, items: [] });
  const dni = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("dni")) || 30));
  const od = new Date(Date.now() - (dni - 1) * 86400000);

  const [{ data: paczki }, { data: zam }, { data: pierwszy }, katalog] = await Promise.all([
    sb.from("ustawienia").select("klucz, wartosc").gte("klucz", PREFIKS + dzien(od)).lte("klucz", PREFIKS + "9999").limit(400),
    sb.from("zamowienia").select("pozycje, klient, status, created_at").in("status", ["oplacone", "wyslane"]).gte("created_at", od.toISOString()).limit(2000),
    sb.from("ustawienia").select("klucz").like("klucz", PREFIKS + "%").order("klucz", { ascending: true }).limit(1),
    katalogWszystko(),
  ]);

  const zamowienia = (zam ?? [])
    .filter((z: any) => !z.klient?.test)
    .map((z: any) => ({ pozycje: (z.pozycje ?? []).map((p: any) => ({ id: String(p.id), ilosc: Number(p.ilosc) || 0 })), korekty: z.klient?.korekty ?? [] }));
  const wiersze = agregujLejek((paczki ?? []).map((p: any) => p.wartosc as DzienLicznika), zamowienia);
  const mapa = new Map(katalog.map((p) => [p.id, p]));
  const items = wiersze
    .map((w) => {
      const p = mapa.get(w.id);
      return { ...w, nazwa: p?.nazwa ?? w.id, zdjecie: p?.zdjecie ?? null, cena: p?.cena ?? null, kolor: p?.kolor ?? null, ukryty: !!p?.ukryty };
    })
    .sort((a, b) => b.wejscia - a.wejscia || b.kupione - a.kupione);

  return Response.json({ ok: true, dni, od: dzien(od), licznikOd: pierwszy?.[0]?.klucz?.slice(PREFIKS.length) ?? null, items });
}
