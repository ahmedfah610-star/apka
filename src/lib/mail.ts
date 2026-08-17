// Wysyłka maili przez Resend (REST). Gdy brak RESEND_API_KEY — nic nie robi
// (sklep działa, tylko bez powiadomień). Wszystkie maile mają wspólny, markowy
// szablon (mailSzablon.ts).

import { M, BAZA, powloka, esc, kartaProduktuMail } from "@/lib/mailSzablon";
import { linkWypisu } from "@/lib/newsletterToken";
import { znajdzPrzewoznika, linkSledzenia } from "@/lib/przewoznicy";

const API = "https://api.resend.com/emails";
const API_BATCH = "https://api.resend.com/emails/batch";

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
  rabat?: number;
  kod?: string | null;
  metoda: string;
  klient: { imie?: string; email?: string; telefon?: string; adres?: string; miasto?: string; kod?: string; paczkomat?: string; punkt?: string; punktOpis?: string };
}

const zl = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} zł`;

async function wyslij(to: string, subject: string, html: string, replyTo?: string): Promise<{ ok: boolean; blad?: string }> {
  const { key, from } = konfiguracja();
  if (!key) return { ok: false, blad: "Brak RESEND_API_KEY" };
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
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

/** Wysyłka wsadowa (do 100 na raz) — do newslettera. */
async function wyslijBatch(wiadomosci: { to: string; subject: string; html: string }[]): Promise<{ wyslano: number }> {
  const { key, from } = konfiguracja();
  if (!key || wiadomosci.length === 0) return { wyslano: 0 };
  let wyslano = 0;
  for (let i = 0; i < wiadomosci.length; i += 100) {
    const partia = wiadomosci.slice(i, i + 100).map((w) => ({ from, to: w.to, subject: w.subject, html: w.html }));
    try {
      const res = await fetch(API_BATCH, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(partia),
      });
      if (res.ok) wyslano += partia.length;
      else console.error(`[mail] batch ${res.status}: ${await res.text().catch(() => "")}`);
    } catch (e) {
      console.error("[mail] batch wyjątek:", e);
    }
  }
  return { wyslano };
}

// ── Elementy współdzielone ──────────────────────────────────────────────

function tabelaPozycji(d: DaneMaila): string {
  const wiersze = d.pozycje
    .map(
      (x) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid ${M.linia};font-size:14px;color:${M.ink}">
          ${esc(x.nazwa)}${x.rozmiar ? `<span style="color:${M.ink3}"> · rozm. ${esc(x.rozmiar)}</span>` : ""}
          <span style="color:${M.ink3}"> × ${x.ilosc}</span>
        </td>
        <td style="padding:11px 0;border-bottom:1px solid ${M.linia};font-size:14px;text-align:right;white-space:nowrap;color:${M.ink}">${zl(x.cena * x.ilosc)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px">
    ${wiersze}
    <tr>
      <td style="padding:11px 0;font-size:14px;color:${M.ink2}">Dostawa${d.metoda ? ` · ${esc(d.metoda)}` : ""}</td>
      <td style="padding:11px 0;font-size:14px;text-align:right;color:${M.ink}">${d.dostawa === 0 ? "gratis" : zl(d.dostawa)}</td>
    </tr>
    ${d.rabat && d.rabat > 0 ? `<tr>
      <td style="padding:11px 0;font-size:14px;color:${M.ink2}">Rabat${d.kod ? ` · ${esc(d.kod)}` : ""}</td>
      <td style="padding:11px 0;font-size:14px;text-align:right;color:${M.ink}">−${zl(d.rabat)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:14px 0 0;font-size:17px;font-weight:800;color:${M.ink}">Razem</td>
      <td style="padding:14px 0 0;font-size:17px;font-weight:800;text-align:right;color:${M.ink}">${zl(d.razem)}</td>
    </tr>
  </table>`;
}

function blokDostawy(k: DaneMaila["klient"]): string {
  const adres = k.paczkomat
    ? `Paczkomat InPost: <strong>${esc(k.paczkomat)}</strong>`
    : k.punkt
    ? `Punkt odbioru: <strong>${esc(k.punkt)}</strong>${k.punktOpis ? ` — ${esc(k.punktOpis)}` : ""}`
    : esc([k.adres, [k.kod, k.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", "));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:${M.tlo};border-radius:12px">
    <tr><td style="padding:16px 18px;font-size:13.5px;line-height:1.7;color:${M.ink2}">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3};margin-bottom:6px">Dane do wysyłki</div>
      <strong style="color:${M.ink}">${esc(k.imie || "")}</strong><br>
      ${adres}${k.telefon ? `<br>tel. ${esc(k.telefon)}` : ""}${k.email ? `<br>${esc(k.email)}` : ""}
    </td></tr>
  </table>`;
}

// ── Maile ───────────────────────────────────────────────────────────────

/** Formularz kontaktowy → skrzynka sklepu (odpowiedź trafia do klienta). */
export async function wyslijMailKontakt(od: { imie: string; email: string; wiadomosc: string }): Promise<{ ok: boolean; blad?: string }> {
  const { sklep } = konfiguracja();
  const to = sklep || "amin.kids1@hotmail.com";
  const html = powloka({
    naglowek: "Nowa wiadomość ze sklepu",
    preheader: `Od ${od.imie}`,
    intro: `<strong style="color:${M.ink}">Od:</strong> ${esc(od.imie)} &lt;${esc(od.email)}&gt;`,
    tresc: `<div style="margin-top:6px;padding:16px 18px;background:${M.tlo};border-left:3px solid ${M.akcent};border-radius:8px;font-size:14.5px;line-height:1.7;color:${M.ink};white-space:pre-wrap">${esc(od.wiadomosc)}</div>
      <p style="margin:16px 0 0;font-size:12.5px;color:${M.ink3}">Odpowiedz na tego e-maila, aby napisać bezpośrednio do klienta.</p>`,
  });
  return wyslij(to, `Wiadomość ze sklepu — ${od.imie}`, html, od.email);
}

/** Test (panel) — zwraca odpowiedź Resend do diagnozy. */
export async function wyslijTest(to: string) {
  const html = powloka({
    emoji: "✓",
    naglowek: "Konfiguracja maili działa",
    intro: "To testowa wiadomość z Twojego sklepu <strong>bobas-shopping</strong>. Jeśli ją widzisz — wysyłka e-maili jest poprawnie skonfigurowana.",
    cta: { tekst: "PRZEJDŹ DO SKLEPU", url: `${BAZA}/produkty` },
  });
  return wyslij(to, "Test — bobas-shopping", html);
}

/** Powitanie po zapisie do newslettera (marketing → z wypisem). */
export async function wyslijMailPowitalny(email: string) {
  if (!mailWlaczony()) return;
  const html = powloka({
    emoji: "🌱",
    naglowek: "Witaj w bobas-shopping!",
    preheader: "Dzięki za zapis — będziesz pierwszy przy nowościach i wyprzedażach.",
    intro:
      "Dziękujemy za zapis do naszego newslettera. Jako pierwszy/pierwsza dowiesz się o <strong>nowych kolekcjach</strong>, <strong>wyprzedażach</strong> i poradnikach dla rodziców.",
    tresc: `<p style="margin:0;font-size:15px;line-height:1.65;color:${M.ink2}">Miękkie, bezpieczne i wygodne ubranka dla dzieci 0–12 lat — z wysyłką InPost i 14 dniami na zwrot. Zajrzyj do nas i znajdź coś dla swojego malucha.</p>`,
    cta: { tekst: "PRZEGLĄDAJ PRODUKTY", url: `${BAZA}/produkty` },
    marketing: true,
    unsubUrl: linkWypisu(email),
  });
  await wyslij(email, "Witaj w bobas-shopping 🌱", html);
}

/** Powitanie po AKTYWACJI konta — wysyłane dopiero po potwierdzeniu e-maila. */
export async function wyslijMailRejestracja(email: string, imie?: string) {
  if (!mailWlaczony()) return;
  const imieOk = esc((imie ?? "").trim().split(" ")[0]);
  const html = powloka({
    emoji: "🎉",
    naglowek: imieOk ? `Witaj, ${imieOk}!` : "Witaj w bobas-shopping!",
    preheader: "Twoje konto jest aktywne — miło Cię gościć!",
    intro:
      "Twój adres e-mail został potwierdzony, a konto w <strong>bobas-shopping</strong> jest już aktywne. Od teraz zakupy są prostsze i wygodniejsze.",
    tresc: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0">
        ${["Historia i podgląd wszystkich zamówień", "Koszyk i ulubione zapisane na każdym urządzeniu", "Szybsze zamawianie — dane uzupełniają się same"]
          .map(
            (t) => `<tr><td style="padding:7px 0;font-size:14.5px;line-height:1.5;color:${M.ink}">
              <span style="color:${M.akcent};font-weight:800">✓</span>&nbsp; ${t}</td></tr>`,
          )
          .join("")}
      </table>`,
    cta: { tekst: "PRZEJDŹ DO KONTA", url: `${BAZA}/konto` },
  });
  await wyslij(email, "Twoje konto jest aktywne — bobas-shopping 🎉", html);
}

/** Produkt/rozmiar znów dostępny. */
export async function wyslijMailDostepnosci(email: string, nazwa: string, rozmiar: string | null, url: string) {
  if (!mailWlaczony()) return;
  const html = powloka({
    emoji: "🎉",
    naglowek: "Znów dostępne!",
    preheader: `${nazwa} jest znów na stanie.`,
    intro: `<strong style="color:${M.ink}">${esc(nazwa)}</strong>${rozmiar ? ` w rozmiarze <strong style="color:${M.ink}">${esc(rozmiar)}</strong>` : ""} jest znów dostępny. Ilość bywa ograniczona — lepiej nie zwlekać.`,
    cta: { tekst: "ZOBACZ PRODUKT", url },
  });
  await wyslij(email, `Znów dostępne: ${nazwa}`, html);
}

/** Potwierdzenie do klienta + powiadomienie do sklepu. */
export async function wyslijMaileZamowienia(d: DaneMaila) {
  const { key, sklep } = konfiguracja();
  if (!key) return;
  const odbiorcaSklep = sklep || "amin.kids1@hotmail.com";
  const nr = d.id.slice(0, 8);
  const zadania: Promise<{ ok: boolean; blad?: string }>[] = [];

  // Do klienta — ciepłe podziękowanie + podsumowanie + śledzenie.
  if (d.klient.email) {
    const html = powloka({
      emoji: "🧡",
      naglowek: "Dziękujemy za zamówienie!",
      preheader: `Zamówienie ${nr} przyjęte. Zajmujemy się nim.`,
      intro: `${d.klient.imie ? `Cześć ${esc(d.klient.imie)}! ` : ""}Twoje zamówienie <strong style="color:${M.ink}">#${nr}</strong> zostało przyjęte. Poniżej podsumowanie — damy znać, gdy paczka ruszy w drogę.`,
      tresc: tabelaPozycji(d) + blokDostawy(d.klient),
      cta: { tekst: "ŚLEDŹ ZAMÓWIENIE", url: `${BAZA}/status-zamowienia` },
    });
    zadania.push(wyslij(d.klient.email, `Potwierdzenie zamówienia ${nr} — bobas-shopping`, html));
  }

  // Do sklepu — rzeczowe powiadomienie.
  const htmlSklep = powloka({
    naglowek: `Nowe zamówienie #${nr}`,
    preheader: `${zl(d.razem)} — ${d.klient.imie || "klient"}`,
    intro: `Wpłynęło nowe zamówienie o wartości <strong style="color:${M.ink}">${zl(d.razem)}</strong>.`,
    tresc: tabelaPozycji(d) + blokDostawy(d.klient),
    cta: { tekst: "PANEL ZAMÓWIEŃ", url: `${BAZA}/admin/zamowienia` },
  });
  zadania.push(wyslij(odbiorcaSklep, `Nowe zamówienie ${nr} — ${zl(d.razem)}`, htmlSklep));

  await Promise.all(zadania);
}

/** Powiadomienie klienta, że paczka została nadana (z numerem i śledzeniem). */
export async function wyslijMailWyslano(order: {
  id: string;
  email?: string;
  imie?: string;
  przewoznik?: string | null;
  numer?: string | null;
}): Promise<{ ok: boolean; blad?: string }> {
  if (!mailWlaczony() || !order.email) return { ok: false, blad: "Brak maila/adresu" };
  const nr = order.id.slice(0, 8);
  const przew = znajdzPrzewoznika(order.przewoznik);
  const url = linkSledzenia(order.przewoznik, order.numer);
  const numer = (order.numer ?? "").trim();

  const infoPrzesylka =
    przew || numer
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;background:${M.tlo};border-radius:12px">
          <tr><td style="padding:16px 18px;font-size:14px;line-height:1.7;color:${M.ink2}">
            <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3};margin-bottom:6px">Przesyłka</div>
            ${przew ? `Przewoźnik: <strong style="color:${M.ink}">${esc(przew.nazwa)}</strong><br>` : ""}
            ${numer ? `Numer: <strong style="color:${M.ink}">${esc(numer)}</strong>` : ""}
          </td></tr>
        </table>`
      : "";

  const html = powloka({
    emoji: "📦",
    naglowek: "Twoja paczka jest w drodze!",
    preheader: `Zamówienie ${nr} zostało nadane.`,
    intro: `${order.imie ? `Cześć ${esc(order.imie.split(" ")[0])}! ` : ""}Dobra wiadomość — Twoje zamówienie <strong style="color:${M.ink}">#${nr}</strong> zostało spakowane i nadane. ${url ? "Możesz śledzić przesyłkę pod przyciskiem poniżej." : "Wkrótce paczka dotrze pod wskazany adres."}`,
    tresc: infoPrzesylka,
    cta: url
      ? { tekst: "ŚLEDŹ PRZESYŁKĘ", url }
      : { tekst: "SZCZEGÓŁY ZAMÓWIENIA", url: `${BAZA}/status-zamowienia` },
  });
  return wyslij(order.email, `Zamówienie ${nr} zostało wysłane 📦 — bobas-shopping`, html);
}

/** Prośba o opinię po zakupie (wysyłana kilka dni po zamówieniu). */
export async function wyslijMailProsbaOOpinie(order: {
  id: string;
  email: string;
  imie?: string;
  produkty: { id: string; nazwa: string }[];
}) {
  if (!mailWlaczony() || !order.email || order.produkty.length === 0) return;
  const e = encodeURIComponent(order.email);
  const link = (id: string) => `${BAZA}/produkty/${id}?opinia=1&email=${e}#opinie`;
  const lista = order.produkty
    .map(
      (p) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${M.linia};font-size:14.5px">
          <a href="${link(p.id)}" style="color:${M.ink};text-decoration:none;font-weight:600">${esc(p.nazwa)}</a>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${M.linia};text-align:right;white-space:nowrap">
          <a href="${link(p.id)}" style="color:${M.akcent};text-decoration:none;font-weight:700;font-size:13px">Oceń ⭐ →</a>
        </td>
      </tr>`,
    )
    .join("");
  const imie = esc((order.imie ?? "").trim().split(" ")[0]);
  const html = powloka({
    emoji: "⭐",
    naglowek: imie ? `${imie}, jak oceniasz zakupy?` : "Jak oceniasz swoje zakupy?",
    preheader: "Twoja opinia zajmie chwilę, a pomoże innym rodzicom.",
    intro:
      "Minęło kilka dni od Twojego zamówienia — mamy nadzieję, że wszystko pasuje i podoba się maluchowi! Będziemy wdzięczni za krótką opinię. Zajmie chwilę, a bardzo pomaga innym rodzicom przy wyborze.",
    tresc: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0">${lista}</table>
      <p style="margin:16px 0 0;font-size:12.5px;color:${M.ink3}">Opinię możesz dodać tylko jako osoba, która kupiła produkt — dlatego przy dodawaniu podaj ten sam e-mail (jest już wpisany w linku).</p>`,
  });
  await wyslij(order.email, "Jak oceniasz swoje zakupy? — bobas-shopping ⭐", html);
}

// ── Cotygodniowy newsletter ─────────────────────────────────────────────

export interface ProduktMail { nazwa: string; cena: number; zdjecie?: string | null; url: string }
export interface ArtykulMail { tytul: string; opis: string; url: string }

/** Buduje HTML jednego cotygodniowego maila (spersonalizowany link wypisu). */
export function mailTygodniowyHtml(opts: { email: string; produkty: ProduktMail[]; artykul?: ArtykulMail }): string {
  const { email, produkty, artykul } = opts;
  const pary: string[] = [];
  for (let i = 0; i < produkty.length; i += 2) {
    const a = produkty[i];
    const b = produkty[i + 1];
    pary.push(`<tr>
      <td width="50%" style="padding:0 8px 18px 0;vertical-align:top">${kartaProduktuMail(a)}</td>
      <td width="50%" style="padding:0 0 18px 8px;vertical-align:top">${b ? kartaProduktuMail(b) : ""}</td>
    </tr>`);
  }
  const siatka = produkty.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">${pary.join("")}</table>`
    : "";

  const blogSekcja = artykul
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:${M.tlo};border-radius:14px">
        <tr><td style="padding:20px 22px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.akcent};margin-bottom:8px">Z bloga</div>
          <a href="${artykul.url}" style="text-decoration:none;color:${M.ink};font-size:17px;font-weight:800;line-height:1.3;display:block;margin-bottom:6px">${esc(artykul.tytul)}</a>
          <p style="margin:0;font-size:13.5px;line-height:1.6;color:${M.ink2}">${esc(artykul.opis)}</p>
          <a href="${artykul.url}" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:${M.ink};text-decoration:underline">Czytaj poradnik →</a>
        </td></tr>
      </table>`
    : "";

  return powloka({
    naglowek: "Co u nas w tym tygodniu",
    preheader: "Nowości, bestsellery i porada dla rodziców.",
    intro: "Wybraliśmy dla Ciebie kilka rzeczy, które teraz szczególnie się podobają — plus świeży poradnik z bloga.",
    tresc: siatka + blogSekcja,
    cta: { tekst: "ZOBACZ CAŁĄ OFERTĘ", url: `${BAZA}/produkty` },
    marketing: true,
    unsubUrl: linkWypisu(email),
  });
}

/** Wysyła cotygodniowy newsletter do listy adresów (wsadowo). */
export async function wyslijNewsletterTygodniowy(
  adresy: string[],
  produkty: ProduktMail[],
  artykul?: ArtykulMail,
): Promise<{ wyslano: number }> {
  if (!mailWlaczony() || adresy.length === 0) return { wyslano: 0 };
  const temat = `bobas-shopping — nowości i porada na ten tydzień`;
  const wiadomosci = adresy.map((email) => ({ to: email, subject: temat, html: mailTygodniowyHtml({ email, produkty, artykul }) }));
  return wyslijBatch(wiadomosci);
}
