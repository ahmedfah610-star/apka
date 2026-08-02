// Wysyłka maili przez Resend (REST). Gdy brak RESEND_API_KEY — nic nie robi
// (sklep działa, tylko bez powiadomień). Nadawca i adres sklepu z env.

const API = "https://api.resend.com/emails";

function konfiguracja() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Fasolka <onboarding@resend.dev>";
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
  klient: { imie?: string; email?: string; telefon?: string; adres?: string; miasto?: string; kod?: string; paczkomat?: string };
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
    <p style="color:#999;font-size:12px;margin-top:24px">Fasolka — ubrania dziecięce</p>
  </div>`;
}

async function wyslij(to: string, subject: string, html: string) {
  const { key, from } = konfiguracja();
  if (!key) return;
  try {
    await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch {
    /* nie blokuj zamówienia z powodu maila */
  }
}

/** Wyślij potwierdzenie do klienta i powiadomienie do sklepu (jeśli skonfigurowane). */
export async function wyslijMaileZamowienia(d: DaneMaila) {
  const { key, sklep } = konfiguracja();
  if (!key) return;
  const zadania: Promise<void>[] = [];
  if (d.klient.email) zadania.push(wyslij(d.klient.email, `Potwierdzenie zamówienia ${d.id.slice(0, 8)} — Fasolka`, szablon(d, true)));
  if (sklep) zadania.push(wyslij(sklep, `Nowe zamówienie ${d.id.slice(0, 8)} — ${zl(d.razem)}`, szablon(d, false)));
  await Promise.all(zadania);
}
