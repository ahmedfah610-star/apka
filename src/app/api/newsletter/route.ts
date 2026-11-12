import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { wyslijMailPowitalny } from "@/lib/mail";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  if (!wLimicie(`newsletter:${ipZadania(req)}`, 5, 60 * 1000)) return limitOdpowiedz();

  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const adres = (email ?? "").trim().toLowerCase();
  if (!EMAIL.test(adres)) return Response.json({ ok: false, blad: "Podaj poprawny e-mail." }, { status: 400 });

  if (supabaseWlaczony()) {
    const sb = sbService();
    if (sb) {
      const { data: nowe, error } = await sb.from("newsletter").upsert({ email: adres }, { onConflict: "email", ignoreDuplicates: true }).select("email");
      if (error) return Response.json({ ok: false, blad: "Nie udało się zapisać." }, { status: 500 });
      // Mail powitalny tylko przy PIERWSZYM zapisie adresu — ponowne „zapisz" nie zasypie skrzynki
      // (ani cudzej, jeśli ktoś wpisze nie swój adres).
      if ((nowe ?? []).length > 0) await wyslijMailPowitalny(adres);
    }
  }
  // Bez bazy — po prostu potwierdzamy (nie blokujemy UI).
  return Response.json({ ok: true });
}
