import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Zgłoszenie "powiadom, gdy znów dostępny".
export async function POST(req: Request) {
  // Ochrona przed zalewem zgłoszeń z jednego adresu — 10 / 10 min.
  if (!wLimicie(`dostepnosc:${ipZadania(req)}`, 10, 10 * 60 * 1000)) return limitOdpowiedz();
  const { produktId, rozmiar, email } = (await req.json().catch(() => ({}))) as {
    produktId?: string;
    rozmiar?: string | null;
    email?: string;
  };
  const adres = (email ?? "").trim().toLowerCase();
  if (!produktId || produktId.length > 80 || (rozmiar && String(rozmiar).length > 20) || adres.length > 120 || !EMAIL.test(adres)) return Response.json({ ok: false, blad: "Podaj poprawny e-mail." }, { status: 400 });

  if (!supabaseWlaczony()) return Response.json({ ok: true });
  const sb = sbService();
  if (!sb) return Response.json({ ok: true });

  const { error } = await sb.from("powiadomienia_dostepnosc").insert({
    produkt_id: produktId,
    rozmiar: rozmiar || null,
    email: adres,
  });
  if (error) return Response.json({ ok: false, blad: "Nie udało się zapisać." }, { status: 500 });
  return Response.json({ ok: true });
}
