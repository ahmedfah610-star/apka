// Wysyłka maili przez Resend (REST). Gdy brak RESEND_API_KEY — nic nie robi
// (sklep działa, tylko bez powiadomień). Wszystkie maile mają wspólny, markowy
// szablon (mailSzablon.ts).

import { M, BAZA, powloka, przycisk, esc, kartaProduktuMail } from "@/lib/mailSzablon";
import { linkWypisu } from "@/lib/newsletterToken";
import { zdjecie } from "@/lib/zdjecia";
import { znajdzPrzewoznika, linkSledzenia } from "@/lib/przewoznicy";
import { zapiszMail, type TypMaila } from "@/lib/mailLog";

const API = "https://api.resend.com/emails";
const API_BATCH = "https://api.resend.com/emails/batch";

function konfiguracja() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "bobas-shopping <onboarding@resend.dev>";
  const sklep = process.env.MAIL_SKLEP; // adres właściciela (powiadomienie o zamówieniu)
  return { key, from, sklep };
}

// Powiadomienie o nowym zamówieniu: adres(y) z MAIL_SKLEP (można po przecinku) + zawsze skrzynka firmy.
const MAIL_FIRMY = "amin.kids1@hotmail.com";
export function odbiorcyZamowien(mailSklep = process.env.MAIL_SKLEP): string[] {
  const adresy = [...(mailSklep ?? "").split(","), MAIL_FIRMY].map((a) => a.trim()).filter((a) => a.includes("@"));
  return adresy.filter((a, i) => adresy.findIndex((b) => b.toLowerCase() === a.toLowerCase()) === i);
}

export function mailWlaczony(): boolean {
  return !!process.env.RESEND_API_KEY;
}

interface PozycjaMail {
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
  kolor?: string | null;
  zdjecie?: string | null;
}
interface DaneMaila {
  id: string;
  pozycje: PozycjaMail[];
  razem: number;
  dostawa: number;
  rabat?: number;
  kod?: string | null;
  metoda: string;
  klient: { imie?: string; email?: string; telefon?: string; adres?: string; miasto?: string; kod?: string; paczkomat?: string; paczkomatOpis?: string; punkt?: string; punktOpis?: string; uwagi?: string; test?: boolean };
}

const zl = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} zł`;

async function wyslij(to: string, subject: string, html: string, typ: TypMaila, replyTo?: string): Promise<{ ok: boolean; blad?: string }> {
  const { key, from } = konfiguracja();
  if (!key) return { ok: false, blad: "Brak RESEND_API_KEY" };
  let wynik: { ok: boolean; blad?: string; idResend?: string };
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) {
      const tekst = await res.text().catch(() => "");
      console.error(`[mail] Resend ${res.status} → ${to}: ${tekst}`);
      wynik = { ok: false, blad: `Resend ${res.status}: ${tekst}`.slice(0, 500) };
    } else {
      const d = (await res.json().catch(() => ({}))) as { id?: string };
      wynik = { ok: true, idResend: d.id };
    }
  } catch (e) {
    const blad = e instanceof Error ? e.message : "błąd sieci";
    console.error(`[mail] wyjątek → ${to}: ${blad}`);
    wynik = { ok: false, blad };
  }
  // Dziennik (podgląd w panelu) — także nieudane próby.
  await zapiszMail({ do: to, temat: subject, typ, html, ok: wynik.ok, blad: wynik.blad, idResend: wynik.idResend });
  return { ok: wynik.ok, blad: wynik.blad };
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
  // Newsletter: jeden wpis w dzienniku na wysyłkę (treść pierwszego maila — różnią się tylko linkiem wypisu).
  await zapiszMail({
    do: `${wiadomosci.length} subskrybentów (newsletter)`,
    temat: wiadomosci[0].subject,
    typ: "newsletter",
    html: wiadomosci[0].html,
    ok: wyslano === wiadomosci.length,
    blad: wyslano === wiadomosci.length ? undefined : `Wysłano ${wyslano} z ${wiadomosci.length}`,
  });
  return { wyslano };
}

// ── Elementy współdzielone ──────────────────────────────────────────────

function tabelaPozycji(d: DaneMaila): string {
  const wiersze = d.pozycje
    .map(
      (x) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid ${M.linia};font-size:14px;color:${M.ink}">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            ${/^https:\/\//.test(x.zdjecie ?? "") ? `<td style="padding-right:12px;vertical-align:top"><img src="${esc(zdjecie(x.zdjecie, "s128"))}" width="52" height="52" alt="" style="display:block;width:52px;height:52px;object-fit:contain;border:1px solid ${M.linia};border-radius:8px;background:#fff"></td>` : ""}
            <td style="vertical-align:top;font-size:14px;color:${M.ink}">
              ${esc(x.nazwa)}<br>
              <span style="font-size:13px;color:${M.ink2}">${[x.kolor ? `kolor: <strong style="color:${M.ink}">${esc(x.kolor)}</strong>` : "", x.rozmiar ? `rozmiar: <strong style="color:${M.ink}">${esc(x.rozmiar)}</strong>` : "", `ilość: <strong style="color:${M.ink}">${x.ilosc}</strong>`].filter(Boolean).join(" · ")}</span>
            </td>
          </tr></table>
        </td>
        <td style="padding:11px 0;border-bottom:1px solid ${M.linia};font-size:14px;text-align:right;white-space:nowrap;color:${M.ink}">${zl(x.cena * x.ilosc)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px">
    ${wiersze}
    <tr>
      <td style="padding:11px 0;font-size:14px;color:${M.ink2}">Dostawa${d.metoda ? ` · ${esc(d.metoda)}` : ""}</td>
      <td style="padding:11px 0;font-size:14px;text-align:right;white-space:nowrap;color:${M.ink}">${d.dostawa === 0 ? "gratis" : zl(d.dostawa)}</td>
    </tr>
    ${d.rabat && d.rabat > 0 ? `<tr>
      <td style="padding:11px 0;font-size:14px;color:${M.ink2}">Rabat${d.kod ? ` · ${esc(d.kod)}` : ""}</td>
      <td style="padding:11px 0;font-size:14px;text-align:right;white-space:nowrap;color:${M.ink}">−${zl(d.rabat)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:14px 0 0;font-size:17px;font-weight:800;color:${M.ink}">Razem</td>
      <td style="padding:14px 0 0;font-size:17px;font-weight:800;text-align:right;white-space:nowrap;color:${M.ink}">${zl(d.razem)}</td>
    </tr>
  </table>`;
}

function blokDostawy(k: DaneMaila["klient"]): string {
  const adres = k.paczkomat
    ? `Paczkomat InPost: <strong>${esc(k.paczkomat)}</strong>${k.paczkomatOpis ? ` — ${esc(k.paczkomatOpis)}` : ""}`
    : k.punkt
    ? `Punkt odbioru: <strong>${esc(k.punkt)}</strong>${k.punktOpis ? ` — ${esc(k.punktOpis)}` : ""}`
    : esc([k.adres, [k.kod, k.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", "));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0;background:${M.tlo};border-radius:12px">
    <tr><td style="padding:16px 18px;font-size:13.5px;line-height:1.7;color:${M.ink2}">
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3};margin-bottom:6px">Dane do wysyłki</div>
      <strong style="color:${M.ink}">${esc(k.imie || "")}</strong><br>
      ${adres}${k.telefon ? `<br>tel. ${esc(k.telefon)}` : ""}${k.email ? `<br>${esc(k.email)}` : ""}
      ${k.uwagi ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${M.linia}"><span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3}">Informacja dla sprzedawcy</span><br><span style="color:${M.ink}">${esc(k.uwagi)}</span></div>` : ""}
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
  return wyslij(to, `Wiadomość ze sklepu — ${od.imie}`, html, "kontakt", od.email);
}

/** Test (panel) — zwraca odpowiedź Resend do diagnozy. */
export async function wyslijTest(to: string) {
  const html = powloka({
    emoji: "✓",
    naglowek: "Konfiguracja maili działa",
    intro: "To testowa wiadomość z Twojego sklepu <strong>bobas-shopping</strong>. Jeśli ją widzisz — wysyłka e-maili jest poprawnie skonfigurowana.",
    cta: { tekst: "PRZEJDŹ DO SKLEPU", url: `${BAZA}/produkty` },
  });
  return wyslij(to, "Test — bobas-shopping", html, "test");
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
  await wyslij(email, "Witaj w bobas-shopping 🌱", html, "powitanie");
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
  await wyslij(email, "Twoje konto jest aktywne — bobas-shopping 🎉", html, "konto");
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
  await wyslij(email, `Znów dostępne: ${nazwa}`, html, "dostepnosc");
}

/** Potwierdzenie do klienta + powiadomienie do sklepu. */
export async function wyslijMaileZamowienia(d: DaneMaila) {
  const { key } = konfiguracja();
  if (!key) return;
  const nr = d.id.slice(0, 8);
  const tag = d.klient.test ? "[TEST] " : ""; // zamówienie testowe — od razu widać w skrzynce
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
    zadania.push(wyslij(d.klient.email, `${tag}Potwierdzenie zamówienia ${nr} — bobas-shopping`, html, "zamowienie"));
  }

  // Do sklepu — rzeczowe powiadomienie.
  const htmlSklep = powloka({
    naglowek: `Nowe zamówienie #${nr}`,
    preheader: `${zl(d.razem)} — ${d.klient.imie || "klient"}`,
    intro: `Wpłynęło nowe zamówienie o wartości <strong style="color:${M.ink}">${zl(d.razem)}</strong>.`,
    tresc: tabelaPozycji(d) + blokDostawy(d.klient),
    cta: { tekst: "PANEL ZAMÓWIEŃ", url: `${BAZA}/admin/zamowienia` },
  });
  for (const adres of odbiorcyZamowien()) {
    zadania.push(wyslij(adres, `${tag}Nowe zamówienie ${nr} — ${zl(d.razem)}`, htmlSklep, "sklep"));
  }

  await Promise.all(zadania);
}

/** Przypomnienie o porzuconym koszyku (dla zalogowanych z zapisanym koszykiem). */
export async function wyslijMailPorzuconyKoszyk(order: {
  email: string;
  imie?: string;
  produkty: ProduktMail[];
}): Promise<{ ok: boolean; blad?: string }> {
  if (!mailWlaczony() || !order.email || order.produkty.length === 0) return { ok: false, blad: "Brak danych" };
  const karty = order.produkty.slice(0, 4).map((p) => kartaProduktuMail(p)).join("");
  const html = powloka({
    emoji: "🛒",
    naglowek: "Zostawiłeś coś w koszyku",
    preheader: "Twój koszyk czeka — dokończ zamówienie w kilka chwil.",
    intro: `${order.imie ? `Cześć ${esc(order.imie.split(" ")[0])}! ` : ""}Twój koszyk wciąż na Ciebie czeka. Produkty są zapisane — możesz dokończyć zamówienie jednym kliknięciem. Pamiętaj, że popularne rozmiary szybko się kończą.`,
    tresc: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${karty}</table>`,
    cta: { tekst: "WRÓĆ DO KOSZYKA", url: `${BAZA}/koszyk` },
  });
  return wyslij(order.email, "Twój koszyk czeka 🛒 — bobas-shopping", html, "koszyk");
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
  return wyslij(order.email, `Zamówienie ${nr} zostało wysłane 📦 — bobas-shopping`, html, "wysylka");
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
  await wyslij(order.email, "Jak oceniasz swoje zakupy? — bobas-shopping ⭐", html, "opinia");
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

  const ile = produkty.length;
  return powloka({
    naglowek: ile > 1 ? "Nowości tygodnia" : "Nowość tygodnia",
    preheader: ile ? `${produkty[0].nazwa}${ile > 1 ? ` i ${ile - 1} więcej` : ""} — świeżo w sklepie.` : "Nowości i porada dla rodziców.",
    intro:
      ile > 1
        ? `W tym tygodniu ${ile <= 4 ? `doszły do sklepu ${ile} nowe rzeczy` : `doszło do sklepu ${ile} nowych rzeczy`} dla dzieci — oto one. Ilości są ograniczone, a pod spodem poradnik z bloga.`
        : "W tym tygodniu doszła do sklepu nowa rzecz dla dzieci — zobacz ją, zanim zniknie. Pod spodem poradnik z bloga.",
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
  artykul: ArtykulMail | undefined,
  temat: string,
): Promise<{ wyslano: number }> {
  if (!mailWlaczony() || adresy.length === 0) return { wyslano: 0 };
  const wiadomosci = adresy.map((email) => ({ to: email, subject: temat, html: mailTygodniowyHtml({ email, produkty, artykul }) }));
  return wyslijBatch(wiadomosci);
}


// ── Pytania o produkt ─────────────────────────────────────────────────────

interface PytanieMail {
  produktId: string;
  nazwa: string;
  zdjecie: string | null;
  cena: number;
  rozmiar: string | null;
  email: string;
  tresc: string;
}

/** Adres, na który klient odpisuje — firmowa skrzynka sklepu (ta sama co w zakładce Kontakt). */
function adresOdpowiedzi(): string {
  return MAIL_FIRMY;
}

const akapity = (t: string) => esc(t).replace(/\r?\n/g, "<br>");

function cytat(tytul: string, tekst: string): string {
  return `<div style="margin:6px 0 18px;padding:14px 16px;background:${M.tlo};border-left:3px solid ${M.akcent};border-radius:8px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3};margin-bottom:6px">${esc(tytul)}</div>
    <div style="font-size:14.5px;line-height:1.65;color:${M.ink}">${akapity(tekst)}</div>
  </div>`;
}

function kartaPytania(p: PytanieMail): string {
  const url = `${BAZA}/produkty/${p.produktId}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:300px">
    <tr><td>${kartaProduktuMail({ nazwa: p.nazwa, cena: p.cena, zdjecie: p.zdjecie, url })}</td></tr>
  </table>${p.rozmiar ? `<p style="margin:8px 0 0;font-size:13px;color:${M.ink2}">Rozmiar: <strong style="color:${M.ink}">${esc(p.rozmiar)}</strong></p>` : ""}`;
}

/** Do sklepu: nowe pytanie (odpowiedź z poczty trafi prosto do klienta — reply-to). */
export async function wyslijPytanieDoSklepu(p: PytanieMail): Promise<void> {
  if (!mailWlaczony()) return;
  const html = powloka({
    naglowek: "Nowe pytanie o produkt",
    preheader: `${p.email}: ${p.tresc.slice(0, 80)}`,
    intro: `Klient <strong style="color:${M.ink}">${esc(p.email)}</strong> pyta o produkt. Odpowiedz w panelu albo po prostu odpisz na tego maila.`,
    tresc: cytat("Pytanie", p.tresc) + kartaPytania(p),
    cta: { tekst: "ODPOWIEDZ W PANELU", url: `${BAZA}/admin/pytania` },
  });
  for (const adres of odbiorcyZamowien()) {
    await wyslij(adres, `Pytanie o produkt: ${p.nazwa.slice(0, 70)}`, html, "pytanie", p.email);
  }
}

/** Do klienta: potwierdzenie, że pytanie dotarło. */
export async function wyslijKopiePytania(p: PytanieMail): Promise<void> {
  if (!mailWlaczony()) return;
  const html = powloka({
    emoji: "💬",
    naglowek: "Twoje pytanie dotarło",
    preheader: "Odpowiemy na tego maila, zwykle w ciągu kilku godzin.",
    intro: "Dziękujemy za pytanie! Odpowiemy na ten adres e-mail, zwykle w ciągu kilku godzin w dni robocze.",
    tresc: cytat("Twoje pytanie", p.tresc) + kartaPytania(p),
    cta: { tekst: "ZOBACZ PRODUKT", url: `${BAZA}/produkty/${p.produktId}` },
  });
  await wyslij(p.email, `Twoje pytanie o produkt — bobas-shopping`, html, "pytanie-kopia", adresOdpowiedzi());
}

/** Do klienta: odpowiedź sklepu (z panelu). */
export async function wyslijOdpowiedzNaPytanie(p: PytanieMail, odpowiedz: string): Promise<{ ok: boolean; blad?: string }> {
  if (!mailWlaczony()) return { ok: false, blad: "Wysyłka maili nie jest skonfigurowana." };
  const html = powloka({
    emoji: "💬",
    naglowek: "Odpowiedź na Twoje pytanie",
    preheader: odpowiedz.slice(0, 90),
    intro: `<span style="font-size:15px;line-height:1.7;color:${M.ink}">${akapity(odpowiedz)}</span>`,
    tresc: cytat("Twoje pytanie", p.tresc) + kartaPytania(p),
    cta: { tekst: "ZOBACZ PRODUKT", url: `${BAZA}/produkty/${p.produktId}` },
  });
  return wyslij(p.email, `Odpowiedź na Twoje pytanie: ${p.nazwa.slice(0, 60)} — bobas-shopping`, html, "odpowiedz", adresOdpowiedzi());
}

// ── Przypomnienie o płatności (zamówienie „oczekuje na płatność") ───────────

export type DanePrzypomnienia = DaneMaila & { data: string };

/** Treść maila „Twoje zamówienie czeka na dokończenie!" — link płatności, koszyk, dostawa, dane klienta. */
export function mailPrzypomnieniaHtml(d: DanePrzypomnienia): string {
  const nr = d.id.slice(0, 8);
  const link = `${BAZA}/zamowienie/zaplac?id=${encodeURIComponent(d.id)}`;
  const kwota = zl(d.razem);
  const dzien = new Date(d.data).toLocaleDateString("pl-PL", { day: "numeric", month: "long", timeZone: "Europe/Warsaw" });
  const imie = d.klient.imie ? esc(d.klient.imie.trim().split(/\s+/)[0]) : "";
  const metoda = d.metoda.replace(/\s*·\s*(Przelewy24|Stripe)\s*$/i, "");
  const kwotaBlok = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;background:${M.tlo};border-radius:12px">
    <tr><td style="padding:16px 18px;font-size:14px;color:${M.ink2}">Do zapłaty</td>
    <td style="padding:16px 18px;font-size:22px;font-weight:800;text-align:right;white-space:nowrap;color:${M.ink}">${kwota}</td></tr>
  </table>`;
  const dopisek = `<p style="margin:22px 0 0;font-size:13px;line-height:1.65;color:${M.ink2}">
      Przycisk prowadzi prosto do bezpiecznej płatności Przelewy24 (BLIK, przelew, karta). Jeśli nie działa, skopiuj link:<br>
      <a href="${esc(link)}" style="color:${M.ink};word-break:break-all">${esc(link)}</a><br><br>
      Coś się nie zgadza w danych albo chcesz coś zmienić? Po prostu odpisz na tego maila — poprawimy.
    </p>`;
  return powloka({
    emoji: "⏳",
    naglowek: "Twoje zamówienie czeka na dokończenie!",
    preheader: `Zamówienie #${nr} jest zarezerwowane — zostało tylko opłacić ${kwota}.`,
    intro: `${imie ? `Cześć ${imie}! ` : ""}Twoje zamówienie <strong style="color:${M.ink}">#${nr}</strong> z ${esc(dzien)} jest zapisane, ale nie dotarła do nas jeszcze płatność. Wystarczy jedno kliknięcie — wyślemy paczkę zaraz po zaksięgowaniu wpłaty.`,
    tresc:
      kwotaBlok +
      przycisk(`ZAPŁAĆ ${kwota.toUpperCase()}`, link) +
      `<div style="margin:30px 0 0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${M.ink3}">Twoje zamówienie</div>` +
      tabelaPozycji({ ...d, metoda }) +
      blokDostawy(d.klient) +
      dopisek,
    cta: { tekst: `ZAPŁAĆ ${kwota.toUpperCase()}`, url: link },
  });
}

/** Wysyłka przypomnienia do klienta (z panelu). Odpowiedź na maila trafia do skrzynki firmy. */
export async function wyslijPrzypomnieniePlatnosci(d: DanePrzypomnienia): Promise<{ ok: boolean; blad?: string }> {
  if (!mailWlaczony()) return { ok: false, blad: "Wysyłka maili nie jest skonfigurowana." };
  if (!d.klient.email) return { ok: false, blad: "Zamówienie nie ma adresu e-mail." };
  return wyslij(
    d.klient.email,
    `Twoje zamówienie #${d.id.slice(0, 8)} czeka na dokończenie — bobas-shopping`,
    mailPrzypomnieniaHtml(d),
    "przypomnienie",
    adresOdpowiedzi(),
  );
}
