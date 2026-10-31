// Historia maili z Resend (przez który sklep wysyła wszystkie maile) — także sprzed
// uruchomienia własnego dziennika. Tylko odczyt: lista + treść jednego maila.
// Zakres historii zależy od planu Resend (przechowywanie logów).

import type { TypMaila } from "@/lib/mailLog";

const API = "https://api.resend.com";
const STRON = 10; // do 1000 maili

export interface MailResend {
  id: string; // „resend:<id>"
  idResend: string;
  do: string;
  temat: string;
  typ: TypMaila;
  ok: boolean;
  blad: string | null;
  zdarzenie: string | null; // last_event: delivered / opened / bounced …
  czas: string;
}

/** Rodzaj maila po temacie (tematy ustawia lib/mail.ts). */
export function typZTematu(temat: string): TypMaila {
  const t = temat.toLowerCase();
  if (t.includes("potwierdzenie zamówienia")) return "zamowienie";
  if (t.includes("nowe zamówienie")) return "sklep";
  if (t.includes("zostało wysłane")) return "wysylka";
  if (t.includes("oceniasz")) return "opinia";
  if (t.includes("koszyk czeka")) return "koszyk";
  if (t.includes("znów dostępne")) return "dostepnosc";
  if (t.includes("witaj w bobas")) return "powitanie";
  if (t.includes("konto jest aktywne")) return "konto";
  if (t.includes("wiadomość ze sklepu")) return "kontakt";
  if (t.startsWith("test")) return "test";
  return "newsletter";
}

const NIEUDANE = ["bounced", "failed", "complained", "canceled"];

/** Data z Resend, np. „2026-10-20 10:15:00.674981+00" (strefa bez minut) → ISO. */
export function dataResend(v: unknown): string {
  const t = String(v ?? "")
    .trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/([+-]\d{2})$/, "$1:00");
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function zWpisu(e: any): MailResend {
  const zdarzenie = typeof e.last_event === "string" ? e.last_event : null;
  const nieudany = !!zdarzenie && NIEUDANE.includes(zdarzenie);
  return {
    id: `resend:${e.id}`,
    idResend: String(e.id),
    do: Array.isArray(e.to) ? e.to.join(", ") : String(e.to ?? ""),
    temat: String(e.subject ?? ""),
    typ: typZTematu(String(e.subject ?? "")),
    ok: !nieudany,
    blad: nieudany ? `Resend: ${zdarzenie}` : null,
    zdarzenie,
    czas: dataResend(e.created_at),
  };
}

function naglowki(): Record<string, string> | null {
  const key = process.env.RESEND_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : null;
}

async function opis(res: Response): Promise<string> {
  const t = await res.text().catch(() => "");
  try {
    const j = JSON.parse(t);
    if (j?.name === "restricted_api_key" || /restricted/i.test(j?.message ?? "")) {
      return "Klucz API Resend ma uprawnienia tylko do wysyłki — do odczytu historii potrzebny jest klucz „Full access”.";
    }
    return `Resend ${res.status}: ${j?.message ?? t}`.slice(0, 300);
  } catch {
    return `Resend ${res.status}: ${t}`.slice(0, 300);
  }
}

/** Lista wysłanych maili z Resend (najnowsze pierwsze). */
export async function listaZResend(): Promise<{ items: MailResend[]; blad?: string }> {
  const h = naglowki();
  if (!h) return { items: [], blad: "Brak klucza RESEND_API_KEY." };
  const items: MailResend[] = [];
  let po: string | null = null;
  for (let i = 0; i < STRON; i++) {
    const url = `${API}/emails?limit=100${po ? `&after=${encodeURIComponent(po)}` : ""}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: h, cache: "no-store" });
    } catch (e) {
      return { items, blad: e instanceof Error ? e.message : "Błąd połączenia z Resend" };
    }
    if (!res.ok) return { items, blad: await opis(res) };
    const d = (await res.json().catch(() => ({}))) as { data?: any[]; has_more?: boolean };
    const strona = Array.isArray(d.data) ? d.data : [];
    items.push(...strona.map(zWpisu));
    if (!d.has_more || strona.length === 0) break;
    po = String(strona[strona.length - 1].id);
  }
  return { items };
}

/** Jeden mail z Resend z treścią HTML. */
export async function mailZResend(idResend: string): Promise<{ mail?: MailResend & { html: string }; blad?: string }> {
  const h = naglowki();
  if (!h) return { blad: "Brak klucza RESEND_API_KEY." };
  if (!/^[a-z0-9-]{8,64}$/i.test(idResend)) return { blad: "Nieprawidłowe id." };
  const res = await fetch(`${API}/emails/${idResend}`, { headers: h, cache: "no-store" }).catch(() => null);
  if (!res) return { blad: "Błąd połączenia z Resend." };
  if (!res.ok) return { blad: await opis(res) };
  const e = (await res.json().catch(() => ({}))) as any;
  const html = typeof e.html === "string" && e.html ? e.html : `<pre style="white-space:pre-wrap;font-family:sans-serif">${String(e.text ?? "Brak treści.").replace(/</g, "&lt;")}</pre>`;
  return { mail: { ...zWpisu(e), html } };
}
