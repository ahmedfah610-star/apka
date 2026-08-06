import { pobierzOpinie, dodajOpinie } from "@/lib/opinieDb";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const produkt = new URL(req.url).searchParams.get("produkt");
  if (!produkt) return Response.json({ items: [] });
  return Response.json({ items: await pobierzOpinie(produkt) });
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Honeypot — ukryte pole wypełniają zwykle boty.
  if (typeof b.hp === "string" && b.hp.trim() !== "") return Response.json({ ok: true });

  const produktId = String(b.produktId ?? "").trim();
  const imie = String(b.imie ?? "").trim().slice(0, 40);
  const ocena = Math.round(Number(b.ocena));
  const tresc = String(b.tresc ?? "").trim().slice(0, 1000);

  if (!produktId) return Response.json({ ok: false, blad: "Brak produktu." }, { status: 400 });
  if (!imie) return Response.json({ ok: false, blad: "Podaj imię." }, { status: 400 });
  if (!(ocena >= 1 && ocena <= 5)) return Response.json({ ok: false, blad: "Wybierz ocenę (1–5 gwiazdek)." }, { status: 400 });

  const r = await dodajOpinie({ produktId, imie, ocena, tresc: tresc || null });
  return Response.json(r, { status: r.ok ? 200 : 500 });
}
