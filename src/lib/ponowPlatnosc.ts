import { sbService, supabaseWlaczony } from "@/lib/supabase";
import { p24Wlaczony, p24Rejestruj } from "@/lib/przelewy24";
import { produktyPoIdSwieze } from "@/lib/produktyDb";
import { ZAMOWIENIA_WYLACZONE, KOMUNIKAT_PRZERWY } from "@/lib/sklep";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WAZNOSC_DNI = 14;

export type WynikPonowienia = { ok: true; url: string } | { ok: false; blad: string; status: number };

/* eslint-disable @typescript-eslint/no-explicit-any */
// „Dokończ płatność": nowa transakcja Przelewy24 dla zamówienia, które czeka na zapłatę —
// z panelu konta, ze strony powrotu z płatności i z linku w mailu z przypomnieniem.
// Uprawnieniem jest pełny, losowy identyfikator zamówienia (UUID v4, 122 bity — znany tylko
// klientowi), tak jak przy sprawdzaniu statusu. Akcja może jedynie utworzyć płatność na kwotę
// zapisaną w zamówieniu, na e-mail z zamówienia.
// Tylko status „oczekuje_na_platnosc", do 14 dni, tylko gdy towar jest nadal dostępny.
export async function nowaPlatnoscZamowienia(id: string, baza: string): Promise<WynikPonowienia> {
  if (ZAMOWIENIA_WYLACZONE) return { ok: false, blad: KOMUNIKAT_PRZERWY, status: 503 };
  if (!p24Wlaczony() || !supabaseWlaczony()) return { ok: false, blad: "Płatności online są chwilowo niedostępne.", status: 503 };
  const sb = sbService();
  if (!sb) return { ok: false, blad: "Błąd konfiguracji.", status: 500 };
  if (!UUID.test(id)) return { ok: false, blad: "Nieprawidłowe zamówienie.", status: 400 };

  const { data: zam } = await sb.from("zamowienia").select("id, created_at, status, razem, pozycje, klient").eq("id", id).maybeSingle();
  if (!zam) return { ok: false, blad: "Nie znaleziono zamówienia.", status: 404 };
  const email = String((zam.klient as any)?.email ?? "").trim();
  if (zam.status !== "oczekuje_na_platnosc") return { ok: false, blad: "To zamówienie nie czeka już na płatność.", status: 409 };
  if (Date.now() - new Date(zam.created_at).getTime() > WAZNOSC_DNI * 86400000) {
    return { ok: false, blad: "Minęło zbyt wiele czasu od złożenia zamówienia — złóż je ponownie (przycisk „Zamów ponownie”).", status: 410 };
  }

  // Towar mógł się w międzyczasie wyprzedać — nie przyjmujemy płatności za coś, czego nie wyślemy.
  const katalog = new Map((await produktyPoIdSwieze(((zam.pozycje as any[]) ?? []).map((p) => String(p?.id ?? "")))).map((p) => [p.id, p]));
  for (const poz of (zam.pozycje as any[]) ?? []) {
    const prod = katalog.get(String(poz.id));
    const rozm = poz.rozmiar ? String(poz.rozmiar) : null;
    const dostepne = !prod ? 0 : rozm && prod.stanRozmiary ? prod.stanRozmiary[rozm] ?? 0 : prod.stan;
    if (typeof dostepne === "number" && dostepne < Number(poz.ilosc || 1)) {
      return {
        ok: false,
        blad: `Produkt „${poz.nazwa}”${rozm ? ` (rozm. ${rozm})` : ""} nie jest już dostępny. Złóż nowe zamówienie lub napisz do nas.`,
        status: 409,
      };
    }
  }

  // Przelewy24 wymaga unikalnego sessionId — kolejna próba dostaje przyrostek (webhook go odcina).
  const rej = await p24Rejestruj({
    sessionId: `${id}_${Date.now().toString(36)}`,
    amount: Math.round(Number(zam.razem) * 100),
    email,
    description: `Zamowienie ${id.slice(0, 8)} - bobas-shopping`,
    urlReturn: `${baza}/zamowienie/dziekujemy?zamowienie=${id}`,
    urlStatus: `${baza}/api/platnosc/p24/webhook`,
  });
  if (!rej.ok || !rej.url) return { ok: false, blad: "Nie udało się rozpocząć płatności. Spróbuj za chwilę.", status: 502 };
  return { ok: true, url: rej.url };
}
