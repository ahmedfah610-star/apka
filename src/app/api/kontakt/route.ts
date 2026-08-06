import { wyslijMailKontakt, mailWlaczony } from "@/lib/mail";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Honeypot na boty.
  if (typeof b.hp === "string" && b.hp.trim() !== "") return Response.json({ ok: true });

  const imie = String(b.imie ?? "").trim().slice(0, 60);
  const email = String(b.email ?? "").trim();
  const wiadomosc = String(b.wiadomosc ?? "").trim().slice(0, 3000);

  if (!imie) return Response.json({ ok: false, blad: "Podaj imię." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return Response.json({ ok: false, blad: "Podaj poprawny e-mail." }, { status: 400 });
  if (wiadomosc.length < 5) return Response.json({ ok: false, blad: "Napisz treść wiadomości." }, { status: 400 });

  if (!mailWlaczony()) {
    return Response.json(
      { ok: false, blad: "Formularz jest chwilowo niedostępny — napisz bezpośrednio na adres e-mail sklepu." },
      { status: 503 },
    );
  }

  const r = await wyslijMailKontakt({ imie, email, wiadomosc });
  if (!r.ok) {
    return Response.json({ ok: false, blad: "Nie udało się wysłać wiadomości. Spróbuj ponownie lub napisz na e-mail sklepu." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
