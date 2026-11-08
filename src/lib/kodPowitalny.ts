// Kod powitalny NOWY5 dla nowych kont: −5% od produktów (dostawa się nie wlicza), bez minimalnej
// kwoty, jeden raz na adres e-mail. Wysyłany mailem każdemu, kto założył konto i przez dobę nic
// nie kupił (codzienny cron) albo ręcznie z panelu (Klienci → Nowe konta).
// Bez nowej tabeli: znacznik wysyłki to wpis w `ustawienia` („kod-powitalny:<id konta>").

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Produkt } from "@/data/produkty";
import { rozmiaryNaStanie } from "@/lib/hitTygodnia";
import { czyCieply, sezonZimowy } from "@/lib/sezon";

export const KOD_POWITALNY = { kod: "NOWY5", procent: 5 } as const;
export const PREFIKS_KODU_POWITALNEGO = "kod-powitalny:";
const KUPIONE = ["oplacone", "wyslane", "nowe"]; // „nowe" = zamówienie bez płatności online
const GODZINA = 3600000;
/** Okno cronu: konta założone 24–72 h temu (cron raz dziennie — zapas na pominięty przebieg). */
export const OKNO_OD_H = 24;
export const OKNO_DO_H = 72;

export interface KontoKlienta {
  id: string;
  email: string;
  imie: string;
  utworzono: string;
  potwierdzone: boolean;
  kupil: boolean;
  kodWyslany: string | null; // czas wysłania kodu
}

const escLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

/** Czy ten e-mail użył już kodu powitalnego w opłaconym zamówieniu. */
export async function kodPowitalnyUzyty(sb: SupabaseClient, email: string): Promise<boolean> {
  const e = email.trim();
  if (!e) return false;
  const { data } = await sb
    .from("zamowienia")
    .select("id")
    .eq("kod_rabatowy", KOD_POWITALNY.kod)
    .in("status", KUPIONE)
    .ilike("klient->>email", escLike(e))
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Konta klientów (najnowsze najpierw) z informacją o zakupach i wysłanym kodzie. */
export async function kontaKlientow(sb: SupabaseClient, limit = 200): Promise<KontoKlienta[]> {
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: limit });
  if (error) throw new Error(error.message);
  const uzytkownicy = (data?.users ?? []) as any[];

  const [{ data: zam }, { data: wyslane }] = await Promise.all([
    sb.from("zamowienia").select("email:klient->>email").in("status", KUPIONE).limit(5000),
    sb.from("ustawienia").select("klucz, wartosc").like("klucz", `${PREFIKS_KODU_POWITALNEGO}%`).limit(5000),
  ]);
  const kupujacy = new Set(((zam ?? []) as { email: string | null }[]).map((z) => (z.email ?? "").trim().toLowerCase()).filter(Boolean));
  const kody = new Map(((wyslane ?? []) as { klucz: string; wartosc: { czas?: string } }[]).map((w) => [w.klucz.slice(PREFIKS_KODU_POWITALNEGO.length), w.wartosc?.czas ?? ""]));

  return uzytkownicy
    .filter((u) => u.email)
    .map((u) => ({
      id: String(u.id),
      email: String(u.email).toLowerCase(),
      imie: String(u.user_metadata?.imie ?? "").trim(),
      utworzono: String(u.created_at),
      potwierdzone: !!(u.email_confirmed_at || u.confirmed_at),
      kupil: kupujacy.has(String(u.email).toLowerCase()),
      kodWyslany: kody.has(String(u.id)) ? kody.get(String(u.id)) || "wysłano" : null,
    }))
    .sort((a, b) => b.utworzono.localeCompare(a.utworzono));
}

/** Komu cron wysyła kod: potwierdzone konto sprzed 24–72 h, bez zakupu, bez wysłanego kodu. */
export function doWysylki(konta: KontoKlienta[], teraz = Date.now()): KontoKlienta[] {
  return konta.filter((k) => {
    const wiek = teraz - new Date(k.utworzono).getTime();
    return k.potwierdzone && !k.kupil && !k.kodWyslany && wiek >= OKNO_OD_H * GODZINA && wiek <= OKNO_DO_H * GODZINA;
  });
}

const rodzaj = (nazwa: string) =>
  nazwa
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

/** Produkty do maila: najchętniej kupowane, zimą najpierw ciepłe, potem najnowsze — dziecięce, na stanie, ze zdjęciem. */
export function polecaneProdukty(katalog: Produkt[], sprzedaz: Map<string, number>, limit = 4, teraz = new Date()): Produkt[] {
  const kolejnosc = new Map(katalog.map((p, i) => [p.id, i]));
  const zima = sezonZimowy(teraz);
  return katalog
    .filter((p) => p.kategoria !== "dorosli" && !p.ukryty && !!p.zdjecie && rozmiaryNaStanie(p).length > 0)
    .sort(
      (a, b) =>
        (sprzedaz.get(b.id) ?? 0) - (sprzedaz.get(a.id) ?? 0) ||
        (zima ? Number(czyCieply(b)) - Number(czyCieply(a)) : 0) ||
        kolejnosc.get(b.id)! - kolejnosc.get(a.id)!,
    )
    // Różnorodnie: podobne produkty (te same pierwsze 3 słowa nazwy, np. inny kolor) tylko raz.
    .filter((p, _i, lista) => lista.find((q) => rodzaj(q.nazwa) === rodzaj(p.nazwa)) === p)
    .slice(0, limit);
}

export async function oznaczWyslany(sb: SupabaseClient, k: Pick<KontoKlienta, "id" | "email">): Promise<string> {
  const czas = new Date().toISOString();
  await sb
    .from("ustawienia")
    .upsert({ klucz: `${PREFIKS_KODU_POWITALNEGO}${k.id}`, wartosc: { email: k.email, czas }, zaktualizowano: czas }, { onConflict: "klucz" });
  return czas;
}
