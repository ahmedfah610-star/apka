import { pobierzOpinie, dodajOpinie, czyKupil } from "@/lib/opinieDb";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";
import { EMAIL_BEZPIECZNY } from "@/lib/escLike";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const produkt = new URL(req.url).searchParams.get("produkt");
  if (!produkt) return Response.json({ items: [] });
  return Response.json({ items: await pobierzOpinie(produkt) });
}

export async function POST(req: Request) {
  if (!wLimicie(`opinie:${ipZadania(req)}`, 5, 60 * 1000)) return limitOdpowiedz();

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Honeypot — ukryte pole wypełniają zwykle boty.
  if (typeof b.hp === "string" && b.hp.trim() !== "") return Response.json({ ok: true });

  const produktId = String(b.produktId ?? "").trim();
  const imie = String(b.imie ?? "").trim().slice(0, 40);
  const email = String(b.email ?? "").trim().toLowerCase();
  const ocena = Math.round(Number(b.ocena));
  const tresc = String(b.tresc ?? "").trim().slice(0, 1000);

  if (!produktId || produktId.length > 80) return Response.json({ ok: false, blad: "Brak produktu." }, { status: 400 });
  if (!imie) return Response.json({ ok: false, blad: "Podaj imię." }, { status: 400 });
  // Bez %, * i \ — inaczej sprawdzenie zakupu pasowałoby do cudzych zamówień.
  if (email.length > 160 || !EMAIL_BEZPIECZNY.test(email)) return Response.json({ ok: false, blad: "Podaj poprawny e-mail." }, { status: 400 });
  if (!(ocena >= 1 && ocena <= 5)) return Response.json({ ok: false, blad: "Wybierz ocenę (1–5 gwiazdek)." }, { status: 400 });

  // Weryfikacja zakupu — tylko klient, który kupił produkt, może go ocenić.
  const kupil = await czyKupil(email, produktId);
  if (!kupil) {
    return Response.json(
      { ok: false, blad: "Opinię mogą dodać tylko klienci, którzy kupili ten produkt. Podaj e-mail użyty przy zamówieniu." },
      { status: 403 },
    );
  }

  const r = await dodajOpinie({ produktId, imie, email, ocena, tresc: tresc || null });
  const status = r.ok ? 200 : r.kod === "duplikat" ? 409 : 500;
  return Response.json(r, { status });
}
