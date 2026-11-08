import type { SupabaseClient } from "@supabase/supabase-js";
import { katalogWidoczny } from "@/lib/produktyDb";
import { sprzedazOstatnio } from "@/lib/hitTygodnia";
import { wyslijMailKodPowitalny, mailWlaczony, type ProduktMail } from "@/lib/mail";
import { BAZA } from "@/lib/mailSzablon";
import { KOD_POWITALNY, kontaKlientow, doWysylki, polecaneProdukty, oznaczWyslany, type KontoKlienta } from "@/lib/kodPowitalny";

async function produktyDoMaila(): Promise<ProduktMail[]> {
  const [katalog, sprzedaz] = await Promise.all([katalogWidoczny(), sprzedazOstatnio()]);
  return polecaneProdukty(katalog, sprzedaz).map((p) => ({ nazwa: p.nazwa, cena: p.cena, zdjecie: p.zdjecie ?? null, url: `${BAZA}/produkty/${p.id}` }));
}

/** Wysyła kod jednemu kontu i zapisuje znacznik (żeby cron nie wysłał drugi raz). */
export async function wyslijKodPowitalny(
  sb: SupabaseClient,
  k: Pick<KontoKlienta, "id" | "email" | "imie">,
  produkty?: ProduktMail[],
): Promise<{ ok: boolean; blad?: string; czas?: string }> {
  const mail = await wyslijMailKodPowitalny({
    email: k.email,
    imie: k.imie,
    kod: KOD_POWITALNY.kod,
    procent: KOD_POWITALNY.procent,
    produkty: produkty ?? (await produktyDoMaila()),
  });
  if (!mail.ok) return mail;
  return { ok: true, czas: await oznaczWyslany(sb, k) };
}

/** Codziennie (z crona „opinie"): konta sprzed 24–72 h bez zakupu i bez wysłanego kodu. */
export async function kodyPowitalneCron(sb: SupabaseClient): Promise<{ ok: boolean; wyslano?: number; kandydatow?: number; blad?: string }> {
  if (!mailWlaczony()) return { ok: false, blad: "brak_maili" };
  try {
    const kandydaci = doWysylki(await kontaKlientow(sb)).slice(0, 30);
    if (!kandydaci.length) return { ok: true, wyslano: 0, kandydatow: 0 };
    const produkty = await produktyDoMaila();
    let wyslano = 0;
    for (const k of kandydaci) if ((await wyslijKodPowitalny(sb, k, produkty)).ok) wyslano++;
    return { ok: true, wyslano, kandydatow: kandydaci.length };
  } catch (e) {
    return { ok: false, blad: e instanceof Error ? e.message : String(e) };
  }
}
