import type Stripe from "stripe";
import { sbService } from "@/lib/supabase";
import { stripe } from "@/lib/platnosci";
import { wyslijMaileZamowienia } from "@/lib/mail";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";

export const dynamic = "force-dynamic";

// Webhook Stripe: po udanej płatności oznacza zamówienie jako opłacone,
// zdejmuje stan magazynowy (RPC) i wysyła maile.
export async function POST(req: Request) {
  const sk = stripe();
  const sekret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sk || !sekret) return new Response("Brak konfiguracji", { status: 500 });

  const podpis = req.headers.get("stripe-signature");
  if (!podpis) return new Response("Brak podpisu", { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = sk.webhooks.constructEvent(raw, podpis, sekret);
  } catch (e) {
    return new Response(`Zły podpis: ${e instanceof Error ? e.message : ""}`, { status: 400 });
  }

  // „completed" przy BLIK/P24 może przyjść przed zapłatą (payment_status „unpaid") — wtedy czekamy
  // na „async_payment_succeeded". Opłacamy tylko sesję faktycznie zapłaconą.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const sesja = event.data.object as Stripe.Checkout.Session;
    const zamowienieId = sesja.metadata?.zamowienie_id;
    const sb = sbService();
    const { data: przed } = zamowienieId && sb ? await sb.from("zamowienia").select("status, razem").eq("id", zamowienieId).maybeSingle() : { data: null };
    const pierwszePotwierdzenie = !!przed && przed.status !== "oplacone";
    // Zapłacona kwota musi pokryć zamówienie (grosze).
    const kwotaOk = !!przed && (sesja.amount_total ?? 0) >= Math.round(Number(przed.razem) * 100) && sesja.currency === "pln";
    if (zamowienieId && sb && sesja.payment_status === "paid" && pierwszePotwierdzenie && kwotaOk) {
      // Oznacz opłacone + zdejmij stan (idempotentnie).
      await sb.rpc("oplac_zamowienie", { p_id: zamowienieId });
      odswiezPoZmianieStanu();
      // Pobierz zamówienie do maili.
      const { data } = await sb.from("zamowienia").select("*").eq("id", zamowienieId).single();
      if (data) {
        await wyslijMaileZamowienia({
          id: data.id,
          pozycje: data.pozycje,
          razem: Number(data.razem),
          dostawa: Number(data.dostawa),
          rabat: Number(data.rabat ?? 0),
          kod: data.kod_rabatowy ?? null,
          metoda: data.metoda ?? "",
          klient: data.klient ?? {},
        });
      }
    }
  }

  return Response.json({ received: true });
}
