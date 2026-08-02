import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijMailDostepnosci, mailWlaczony } from "@/lib/mail";

type Sr = Record<string, number> | null | undefined;

/**
 * Po zmianie stanu produktu wysyła maile do osób, które prosiły o powiadomienie,
 * dla rozmiarów które przeszły z 0 na >0 (oraz zgłoszeń „cały produkt", gdy produkt
 * był wyprzedany i znów jest dostępny). Oznacza zgłoszenia jako obsłużone.
 */
export async function powiadomOOdblokowaniu(
  sb: SupabaseClient,
  produktId: string,
  nazwa: string,
  bazowyUrl: string,
  stareStan: number | null,
  stareSr: Sr,
  noweStan: number | null,
  noweSr: Sr,
) {
  if (!mailWlaczony()) return;

  const rozmiaryOdblokowane: string[] = [];
  if (noweSr) {
    for (const [rozm, ilosc] of Object.entries(noweSr)) {
      const stara = stareSr?.[rozm] ?? 0;
      if ((Number(ilosc) || 0) > 0 && stara <= 0) rozmiaryOdblokowane.push(rozm);
    }
  }
  const bylWyprzedany = (stareStan ?? 0) <= 0;
  const jestDostepny = (noweStan ?? 0) > 0;
  const produktOdblokowany = bylWyprzedany && jestDostepny;

  if (rozmiaryOdblokowane.length === 0 && !produktOdblokowany) return;

  const url = `${bazowyUrl}/produkty/${produktId}`;

  // Cele: konkretne rozmiary + (opcjonalnie) zgłoszenia bez rozmiaru.
  const cele: (string | null)[] = [...rozmiaryOdblokowane];
  if (produktOdblokowany) cele.push(null);

  for (const rozmiar of cele) {
    let q = sb.from("powiadomienia_dostepnosc").select("id,email").eq("produkt_id", produktId).eq("powiadomiony", false);
    q = rozmiar === null ? q.is("rozmiar", null) : q.eq("rozmiar", rozmiar);
    const { data } = await q;
    if (!data || data.length === 0) continue;
    await Promise.all(data.map((r: { email: string }) => wyslijMailDostepnosci(r.email, nazwa, rozmiar, url)));
    await sb
      .from("powiadomienia_dostepnosc")
      .update({ powiadomiony: true })
      .in("id", data.map((r: { id: string }) => r.id));
  }
}
