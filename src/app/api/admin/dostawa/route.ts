import { revalidatePath, revalidateTag } from "next/cache";
import { czyAdmin, odmowa } from "@/lib/adminAuth";
import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { polaczUstawienia } from "@/lib/dostawa";
import { TAG_DOSTAWY } from "@/lib/dostawaDb";

export const dynamic = "force-dynamic";

// Zapis cen i opisów dostaw (tryb admina). Walidacja/obcięcie w polaczUstawienia.
export async function PUT(req: Request) {
  if (!czyAdmin()) return odmowa();
  if (!supabaseWlaczony()) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Brak bazy." }, { status: 501 });

  const wejscie = await req.json().catch(() => null);
  const u = polaczUstawienia(wejscie);
  const wartosc = {
    darmowaOd: u.darmowaOd,
    metody: u.metody.map((m) => ({ id: m.id, nazwa: m.nazwa, opis: m.opis, info: m.info ?? "", cena: m.cena, aktywna: m.aktywna !== false })),
  };
  if (!wartosc.metody.some((m) => m.aktywna)) return Response.json({ ok: false, blad: "Zostaw włączoną co najmniej jedną metodę dostawy." }, { status: 400 });

  const { error } = await sb.from("ustawienia").upsert({ klucz: "dostawa", wartosc, zaktualizowano: new Date().toISOString() }, { onConflict: "klucz" });
  if (error) return Response.json({ ok: false, blad: error.message }, { status: 500 });

  revalidateTag(TAG_DOSTAWY);
  revalidatePath("/", "layout"); // strony z cenami dostawy (strona główna, produkty, dostawa, FAQ)
  return Response.json({ ok: true, ustawienia: polaczUstawienia(wartosc) });
}
