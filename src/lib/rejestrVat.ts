import { normalizujNip, nipPoprawny } from "@/lib/faktura";

// Dane firmy po NIP z publicznego wykazu podatników VAT Ministerstwa Finansów („biała lista").
// Bez klucza, ale z limitem zapytań — dlatego wynik jest buforowany, a błąd nie blokuje
// zamówienia (klient wpisuje dane ręcznie).

export interface FirmaZRejestru {
  nip: string;
  nazwa: string;
  adres: string;
  kod: string;
  miasto: string;
  statusVat: string; // „Czynny", „Zwolniony", „Niezarejestrowany"…
}

const API = "https://wl-api.mf.gov.pl/api/search/nip";

// Formy prawne zapisane tak, jak na fakturach (rejestr podaje WIELKIMI LITERAMI).
const FORMY: [RegExp, string][] = [
  [/\bspółka z ograniczoną odpowiedzialnością\b/gi, "sp. z o.o."],
  [/\bsp\.? ?z ?o\.? ?o\.?/gi, "Sp. z o.o."],
  [/\bspółka akcyjna\b/gi, "S.A."],
  [/\bs\.a\.?(?=\s|$)/gi, "S.A."],
  [/\bsp\.? ?k\.?(?=\s|$)/gi, "Sp.k."],
  [/\bsp\.? ?j\.?(?=\s|$)/gi, "Sp.j."],
];

/** „KWIATEK I SYN SP. Z O.O." → „Kwiatek i Syn Sp. z o.o." (tylko gdy cały tekst jest wielkimi literami). */
export function ladnaWielkosc(s: string): string {
  const t = String(s ?? "").trim().replace(/\s+/g, " ");
  if (!t || t !== t.toUpperCase()) return t;
  let w = t
    .toLowerCase()
    .replace(/(^|[\s\-("„/])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\b(I|W|Z|Na|Do|Od|Dla|Oraz)\b(?=\s)/g, (m, _a, i: number) => (i === 0 ? m : m.toLowerCase()));
  for (const [re, zam] of FORMY) w = w.replace(re, zam);
  return w;
}

/** „UL. LIPOWA 12/4, 20-001 LUBLIN" → { adres: „ul. Lipowa 12/4", kod: „20-001", miasto: „Lublin" }. */
export function rozbijAdres(pelny: string | null | undefined): { adres: string; kod: string; miasto: string } {
  const t = String(pelny ?? "").trim();
  const m = /^(.*),\s*(\d{2}-\d{3})\s+(.+)$/.exec(t);
  if (!m) return { adres: ladnaWielkosc(t), kod: "", miasto: "" };
  const adres = ladnaWielkosc(m[1]).replace(/^Ul\.\s*/, "ul. ").replace(/^Al\.\s*/, "al. ").replace(/^Os\.\s*/, "os. ").replace(/^Pl\.\s*/, "pl. ");
  return { adres, kod: m[2], miasto: ladnaWielkosc(m[3]) };
}

export async function firmaPoNip(nipWe: string, teraz = new Date()): Promise<{ ok: true; firma: FirmaZRejestru } | { ok: false; blad: string }> {
  const nip = normalizujNip(nipWe);
  if (!nipPoprawny(nip)) return { ok: false, blad: "NIP jest nieprawidłowy — sprawdź cyfry." };
  const data = teraz.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" }); // RRRR-MM-DD
  try {
    const r = await fetch(`${API}/${nip}?date=${data}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) });
    const d = (await r.json().catch(() => ({}))) as {
      result?: { subject?: { name?: string; nip?: string; statusVat?: string; workingAddress?: string | null; residenceAddress?: string | null } | null };
      message?: string;
    };
    if (!r.ok) return { ok: false, blad: r.status === 429 ? "Rejestr VAT jest chwilowo przeciążony — wpisz dane ręcznie." : "Nie udało się sprawdzić NIP — wpisz dane ręcznie." };
    const s = d.result?.subject;
    if (!s?.name) return { ok: false, blad: "Nie znaleźliśmy tej firmy w rejestrze VAT — wpisz dane ręcznie." };
    const adres = rozbijAdres(s.workingAddress || s.residenceAddress);
    return { ok: true, firma: { nip, nazwa: ladnaWielkosc(s.name), ...adres, statusVat: s.statusVat ?? "" } };
  } catch {
    return { ok: false, blad: "Rejestr VAT nie odpowiada — wpisz dane ręcznie." };
  }
}
