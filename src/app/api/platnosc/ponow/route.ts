import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { bazowyUrl } from "@/lib/platnosci";
import { p24Wlaczony, p24Rejestruj } from "@/lib/przelewy24";
import { katalogWidoczny } from "@/lib/produktyDb";
import { ipZadania, wLimicie, limitOdpowiedz } from "@/lib/rateLimit";
import { ZAMOWIENIA_WYLACZONE, KOMUNIKAT_PRZERWY } from "@/lib/sklep";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WAZNOSC_DNI = 14;

/* eslint-disable @typescript-eslint/no-explicit-any */
// „Dokończ płatność" z panelu klienta: nowa transakcja Przelewy24 dla zamówienia, które czeka
// na zapłatę. Tylko właściciel zamówienia (sesja klienta, e-mail z zamówienia), tylko status
// „oczekuje_na_platnosc", tylko gdy towar jest nadal dostępny. Kwota = zapisana w zamówieniu.
export async function POST(req: Request) {
  if (!wLimicie(`ponow:${ipZadania(req)}`, 10, 10 * 60 * 1000)) return limitOdpowiedz();
  if (ZAMOWIENIA_WYLACZONE) return Response.json({ ok: false, blad: KOMUNIKAT_PRZERWY }, { status: 503 });
  if (!p24Wlaczony() || !supabaseWlaczony()) {
    return Response.json({ ok: false, blad: "Płatności online są chwilowo niedostępne." }, { status: 503 });
  }
  const sb = sbService();
  if (!sb) return Response.json({ ok: false, blad: "Błąd konfiguracji." }, { status: 500 });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const email = auth.user?.email?.toLowerCase();
  if (!email) return Response.json({ ok: false, blad: "Zaloguj się ponownie i spróbuj jeszcze raz." }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as { id?: unknown };
  const id = String(b.id ?? "");
  if (!UUID.test(id)) return Response.json({ ok: false, blad: "Nieprawidłowe zamówienie." }, { status: 400 });

  const { data: zam } = await sb.from("zamowienia").select("id, created_at, status, razem, pozycje, klient").eq("id", id).maybeSingle();
  // Cudze lub nieistniejące zamówienie — ta sama odpowiedź (bez ujawniania, że istnieje).
  if (!zam || String((zam.klient as any)?.email ?? "").toLowerCase() !== email) {
    return Response.json({ ok: false, blad: "Nie znaleziono zamówienia." }, { status: 404 });
  }
  if (zam.status !== "oczekuje_na_platnosc") {
    return Response.json({ ok: false, blad: "To zamówienie nie czeka już na płatność." }, { status: 409 });
  }
  if (Date.now() - new Date(zam.created_at).getTime() > WAZNOSC_DNI * 86400000) {
    return Response.json(
      { ok: false, blad: "Minęło zbyt wiele czasu od złożenia zamówienia — złóż je ponownie (przycisk „Zamów ponownie”)." },
      { status: 410 },
    );
  }

  // Towar mógł się w międzyczasie wyprzedać — nie przyjmujemy płatności za coś, czego nie wyślemy.
  const katalog = new Map((await katalogWidoczny()).map((p) => [p.id, p]));
  for (const poz of (zam.pozycje as any[]) ?? []) {
    const prod = katalog.get(String(poz.id));
    const rozm = poz.rozmiar ? String(poz.rozmiar) : null;
    const dostepne = !prod ? 0 : rozm && prod.stanRozmiary ? prod.stanRozmiary[rozm] ?? 0 : prod.stan;
    if (typeof dostepne === "number" && dostepne < Number(poz.ilosc || 1)) {
      return Response.json(
        { ok: false, blad: `Produkt „${poz.nazwa}”${rozm ? ` (rozm. ${rozm})` : ""} nie jest już dostępny. Złóż nowe zamówienie lub napisz do nas.` },
        { status: 409 },
      );
    }
  }

  // Przelewy24 wymaga unikalnego sessionId — kolejna próba dostaje przyrostek (webhook go odcina).
  const baza = bazowyUrl(req);
  const rej = await p24Rejestruj({
    sessionId: `${id}_${Date.now().toString(36)}`,
    amount: Math.round(Number(zam.razem) * 100),
    email,
    description: `Zamowienie ${id.slice(0, 8)} - bobas-shopping`,
    urlReturn: `${baza}/zamowienie/dziekujemy?zamowienie=${id}`,
    urlStatus: `${baza}/api/platnosc/p24/webhook`,
  });
  if (!rej.ok || !rej.url) return Response.json({ ok: false, blad: "Nie udało się rozpocząć płatności. Spróbuj za chwilę." }, { status: 502 });
  return Response.json({ ok: true, url: rej.url });
}
