import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { wyslijMailPowitalny } from "@/lib/mail";

export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const adres = (email ?? "").trim().toLowerCase();
  if (!EMAIL.test(adres)) return Response.json({ ok: false, blad: "Podaj poprawny e-mail." }, { status: 400 });

  if (supabaseWlaczony()) {
    const sb = sbService();
    if (sb) {
      const { error } = await sb.from("newsletter").upsert({ email: adres }, { onConflict: "email", ignoreDuplicates: true });
      if (error) return Response.json({ ok: false, blad: "Nie udało się zapisać." }, { status: 500 });
      await wyslijMailPowitalny(adres);
    }
  }
  // Bez bazy — po prostu potwierdzamy (nie blokujemy UI).
  return Response.json({ ok: true });
}
