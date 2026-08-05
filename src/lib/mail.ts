// Wysyłka maili przez Resend (REST). Gdy brak RESEND_API_KEY — nic nie robi
// (sklep działa, tylko bez powiadomień). Nadawca i adres sklepu z env.

const API = "https://api.resend.com/emails";

function konfiguracja() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "bobas-shopping <onboarding@resend.dev>";
  const sklep = process.env.MAIL_SKLEP; // adres właściciela (powiadomienie o zamówieniu)
  return { key, from, sklep };
}

export function mailWlaczony(): boolean {
  return !!process.env.RESEND_API_KEY;
}

interface PozycjaMail {
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
}
interface DaneMaila {
  id: string;
  pozycje: PozycjaMail[];
  razem: number;
  dostawa: number;
  metoda: string;
  klient: { imie?: string; email?: string; telefon?: string; adres?: string; miasto?: string; kod?: string; paczkomat?: string; punkt?: string; punktOpis?: string };
}

const zl = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;

function wierszePozycji(p: PozycjaMail[]): string {
  return p
    .map(
      (x) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${x.nazwa}${x.rozmiar ? ` · rozm. ${x.rozmiar}` : ""} × ${x.ilosc}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${zl(x.cena * x.ilosc)}</td></tr>`,
    )
    .join("");
}

function szablon(d: DaneMaila, doKlienta: boolean): string {
  const k = d.klient;
  const adres = k.paczkomat
    ? `Paczkomat: ${k.paczkomat}`
    : k.punkt
    ? `ORLEN Paczka: ${k.punkt}${k.punktOpis ? ` — ${k.punktOpis}` : ""}`
    : [k.adres, [k.kod, k.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c">
    <h1 style="font-size:22px">${doKlienta ? "Dziękujemy za zamówienie!" : "Nowe zamówienie"}</h1>
    <p style="color:#666;font-size:14px">Numer zamówienia: <strong>${d.id.slice(0, 8)}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      ${wierszePozycji(d.pozycje)}
      <tr><td style="padding:6px 0;color:#666">Dostawa (${d.metoda})</td><td style="padding:6px 0;text-align:right">${d.dostawa === 0 ? "gratis" : zl(d.dostawa)}</td></tr>
      <tr><td style="padding:10px 0;font-weight:700;font-size:16px">Razem</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px">${zl(d.razem)}</td></tr>
    </table>
    <p style="font-size:14px"><strong>${k.imie || ""}</strong><br>${k.email || ""}${k.telefon ? " · " + k.telefon : ""}<br>${adres}</p>
    <p style="color:#999;font-size:12px;margin-top:24px">bobas-shopping — ubrania dziecięce</p>
  </div>`;
}

async function wyslij(to: string, subject: string, html: string): Promise<{ ok: boolean; blad?: string }> {
  const { key, from } = konfiguracja();
  if (!key) return { ok: false, blad: "Brak RESEND_API_KEY" };
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const tekst = await res.text().catch(() => "");
      console.error(`[mail] Resend ${res.status} → ${to}: ${tekst}`);
      return { ok: false, blad: `Resend ${res.status}: ${tekst}` };
    }
    return { ok: true };
  } catch (e) {
    const blad = e instanceof Error ? e.message : "błąd sieci";
    console.error(`[mail] wyjątek → ${to}: ${blad}`);
    return { ok: false, blad };
  }
}

/** Wysyłka testowa (panel) — zwraca faktyczną odpowiedź Resend do diagnozy. */
export async function wyslijTest(to: string) {
  return wyslij(
    to,
    "Test — bobas-shopping",
    `<div style="font-family:system-ui,Arial,sans-serif"><h2>Działa ✓</h2><p>To testowy e-mail z Twojego sklepu bobas-shopping.</p></div>`,
  );
}

/** Mail powitalny po zapisie do newslettera. */
export async function wyslijMailPowitalny(email: string) {
  if (!mailWlaczony()) return;
  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1c1c">
    <h1 style="font-size:22px">Cześć! 👋</h1>
    <p style="font-size:15px;line-height:1.6">Dzięki za zapis do newslettera bobas-shopping. Damy Ci znać jako pierwszej/pierwszemu
    o nowych kolekcjach i wyprzedażach.</p>
    <p style="color:#999;font-size:12px;margin-top:24px">bobas-shopping — ubrania dziecięce</p>
  </div>`;
  await wyslij(email, "Witaj w bobas-shopping 🌱", html);
}

/** Mail: produkt/rozmiar znów dostępny. */
export async function wyslijMailDostepnosci(email: string, nazwa: string, rozmiar: string | null, url: string) {
  if (!mailWlaczony()) return;
  const html = `
  <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1c1c1c">
    <h1 style="font-size:22px">Znów dostępne! 🎉</h1>
    <p style="font-size:15px;line-height:1.6"><strong>${nazwa}</strong>${rozmiar ? ` w rozmiarze <strong>${rozmiar}</strong>` : ""} jest znów na stanie.</p>
    <p><a href="${url}" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;padding:12px 22px;font-size:13px;font-weight:600">ZOBACZ PRODUKT</a></p>
    <p style="color:#999;font-size:12px;margin-top:24px">Ilość jest ograniczona — nie zwlekaj. Fasolka</p>
  </div>`;
  await wyslij(email, `Znów dostępne: ${nazwa}`, html);
}

/** Wyślij potwierdzenie do klienta i powiadomienie do sklepu (jeśli skonfigurowane). */
export async function wyslijMaileZamowienia(d: DaneMaila) {
  const { key, sklep } = konfiguracja();
  if (!key) return;
  const zadania: Promise<{ ok: boolean; blad?: string }>[] = [];
  if (d.klient.email) zadania.push(wyslij(d.klient.email, `Potwierdzenie zamówienia ${d.id.slice(0, 8)} — bobas-shopping`, szablon(d, true)));
  if (sklep) zadania.push(wyslij(sklep, `Nowe zamówienie ${d.id.slice(0, 8)} — ${zl(d.razem)}`, szablon(d, false)));
  await Promise.all(zadania);
}
