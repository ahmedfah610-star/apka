import { sbService } from "@/lib/supabase";
import { p24PodpisNotyfikacjiOk, p24Weryfikuj, type P24Notyfikacja } from "@/lib/przelewy24";
import { wyslijMaileZamowienia } from "@/lib/mail";
import { odswiezPoZmianieStanu } from "@/lib/rewalidacja";
import { zuzyjKod } from "@/lib/kodyDb";

export const dynamic = "force-dynamic";

// Powiadomienie Przelewy24 (urlStatus). P24 wysyła je serwer-serwer po płatności.
// Kroki: weryfikacja podpisu → potwierdzenie transakcji (verify) → oznaczenie
// zamówienia jako opłaconego, zdjęcie stanu (RPC) i wysyłka maili.
export async function POST(req: Request) {
  let n: P24Notyfikacja;
  try {
    n = (await req.json()) as P24Notyfikacja;
  } catch {
    return new Response("Zły format", { status: 400 });
  }

  if (!p24PodpisNotyfikacjiOk(n)) {
    console.error("[p24] webhook: zły podpis powiadomienia");
    return new Response("Zły podpis", { status: 400 });
  }

  const sb = sbService();
  if (!sb) return new Response("Brak konfiguracji", { status: 500 });

  const zamowienieId = n.sessionId;
  const { data: zam } = await sb.from("zamowienia").select("*").eq("id", zamowienieId).single();
  if (!zam) return Response.json({ received: true }); // nic do zrobienia

  // Potwierdzenie transakcji w P24 (kwota z zamówienia = kwota zarejestrowana).
  const amount = Math.round(Number(zam.razem) * 100);
  const ok = await p24Weryfikuj({ sessionId: zamowienieId, orderId: n.orderId, amount });
  if (!ok) {
    console.error(`[p24] webhook: weryfikacja nieudana dla ${zamowienieId}`);
    return new Response("Weryfikacja nieudana", { status: 400 });
  }

  // Czy to pierwsze potwierdzenie (idempotencja licznika kodu).
  const pierwszePotwierdzenie = zam.status !== "oplacone";

  // Oznacz opłacone + zdejmij stan (idempotentnie).
  await sb.rpc("oplac_zamowienie", { p_id: zamowienieId });
  odswiezPoZmianieStanu();

  // Policz użycie kodu rabatowego tylko przy pierwszym opłaceniu.
  if (pierwszePotwierdzenie && zam.kod_rabatowy) await zuzyjKod(String(zam.kod_rabatowy));

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

  return Response.json({ received: true });
}
