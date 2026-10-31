import { czyAdmin } from "@/lib/adminAuth";
import { sbService } from "@/lib/supabase";
import { wyslijMailKorekta } from "@/lib/mail";
import { obliczKorekte, type Korekta } from "@/lib/korekty";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
async function wczytaj(id: string) {
  const sb = sbService();
  if (!sb || !id) return { sb, zam: null };
  const { data } = await sb.from("zamowienia").select("id, pozycje, suma, rabat, dostawa, razem, klient").eq("id", id).maybeSingle();
  return { sb, zam: data as any };
}

// Brak produktu / zwrot: zapis w zamówieniu + (opcjonalnie) mail do klienta z kwotą zwrotu.
// Pieniądze zwraca się w panelu Przelewy24 — tu jest rozliczenie i informacja dla klienta.
export async function POST(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    id?: string;
    typ?: string;
    pozycje?: { indeks: number; ilosc: number }[];
    zwrotDostawy?: boolean;
    notatka?: string;
    powiadom?: boolean;
  };
  const { sb, zam } = await wczytaj(String(b.id ?? ""));
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  if (!zam) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });

  const klient = (zam.klient ?? {}) as Record<string, any>;
  const korekty: Korekta[] = Array.isArray(klient.korekty) ? klient.korekty : [];
  const wynik = obliczKorekte(
    {
      pozycje: (zam.pozycje ?? []).map((p: any) => ({ nazwa: String(p.nazwa), cena: Number(p.cena) || 0, ilosc: Number(p.ilosc) || 0, rozmiar: p.rozmiar ?? null, kolor: p.kolor ?? null })),
      suma: Number(zam.suma) || 0,
      rabat: Number(zam.rabat) || 0,
      dostawa: Number(zam.dostawa) || 0,
      razem: Number(zam.razem) || 0,
      korekty,
    },
    { typ: String(b.typ ?? ""), pozycje: b.pozycje ?? [], zwrotDostawy: !!b.zwrotDostawy, notatka: b.notatka },
  );
  if ("blad" in wynik) return Response.json({ ok: false, blad: wynik.blad }, { status: 400 });

  const korekta = wynik.korekta;
  let mail: { ok: boolean; blad?: string } | undefined;
  if (b.powiadom) {
    mail = await wyslijMailKorekta({ ...korekta, id: zam.id, email: klient.email, imie: klient.imie });
    korekta.mail = !!mail.ok;
  }
  const { error } = await sb.from("zamowienia").update({ klient: { ...klient, korekty: [...korekty, korekta] } }).eq("id", zam.id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true, korekta, mail });
}

// Cofnięcie pomyłkowo dodanej korekty (mail, jeśli poszedł, już wyszedł).
export async function DELETE(req: Request) {
  if (!czyAdmin()) return Response.json({ ok: false }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { id?: string; korekta?: string };
  const { sb, zam } = await wczytaj(String(b.id ?? ""));
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  if (!zam) return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });
  const klient = (zam.klient ?? {}) as Record<string, any>;
  const korekty: Korekta[] = Array.isArray(klient.korekty) ? klient.korekty : [];
  const nowe = korekty.filter((k) => k.id !== b.korekta);
  if (nowe.length === korekty.length) return Response.json({ ok: false, blad: "Nie ma takiej korekty." }, { status: 404 });
  const { error } = await sb.from("zamowienia").update({ klient: { ...klient, korekty: nowe } }).eq("id", zam.id);
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
