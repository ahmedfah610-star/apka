import { wyslijMailRejestracja } from "@/lib/mail";
import { sbService } from "@/lib/supabase";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const SWIEZE_KONTO_MS = 24 * 3600 * 1000;

// Mail powitalny po aktywacji konta (/auth/confirm, rejestracja bez potwierdzenia, pierwsze logowanie Google).
// Tylko dla ZALOGOWANEGO, świeżo założonego konta (sesja w nagłówku Authorization) i tylko raz —
// adres bierzemy z konta, nie z żądania, więc nikt nie wyśle naszych maili na cudzy adres.
export async function POST(req: Request) {
  if (!wLimicie(`powitanie:${ipZadania(req)}`, 4, 60 * 1000)) return limitOdpowiedz();
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return Response.json({ ok: false }, { status: 401 });
  const sb = sbService();
  if (!sb) return Response.json({ ok: false }, { status: 503 });

  const { data } = await sb.auth.getUser(token);
  const u = data?.user;
  if (!u?.email) return Response.json({ ok: false }, { status: 401 });
  if (Date.now() - new Date(u.created_at).getTime() > SWIEZE_KONTO_MS) return Response.json({ ok: true, wyslano: false });

  // Znacznik „już powitany" — insert zawiedzie przy drugim wywołaniu (klucz unikalny).
  const czas = new Date().toISOString();
  const { error } = await sb.from("ustawienia").insert({ klucz: `powitanie:${u.id}`, wartosc: { czas }, zaktualizowano: czas });
  if (error) return Response.json({ ok: true, wyslano: false });

  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const imie = String(meta.imie || meta.full_name || meta.name || "").slice(0, 60) || undefined;
  await wyslijMailRejestracja(u.email, imie);
  return Response.json({ ok: true, wyslano: true });
}
