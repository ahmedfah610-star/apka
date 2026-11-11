// Mail z dokumentem do zamówienia (faktura, korekta, dowód zakupu, inny). Treść generuje się
// sama z typu dokumentu. Plik bez zależności serwerowych — ten sam szablon w podglądzie
// w panelu i w wysyłce.

import { M, BAZA, powloka, esc } from "@/lib/mailSzablon";
import { NAZWY_DOKUMENTOW, nipCzytelny, type DaneFaktury, type TypDokumentu } from "@/lib/faktura";

export interface DaneMailaDokumentu {
  typ: TypDokumentu;
  zamowienieId: string;
  dataZamowienia: string;
  razem: number;
  imie?: string;
  faktura?: DaneFaktury | null;
  numer?: string;
  ksef?: string;
  nazwaDokumentu?: string; // „inny"
  dotyczy?: string; // korekta
  przyczyna?: string; // korekta
  kwota?: number; // korekta
  nazwaPliku: string;
  dopisek?: string;
  link?: string; // podpisany link „Otwórz" do pliku (w podglądzie w panelu: "#")
}

const zl = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2).replace(".", ",")} zł`;
const dzien = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

function nazwa(d: DaneMailaDokumentu): string {
  return d.typ === "inny" ? (d.nazwaDokumentu?.trim() || NAZWY_DOKUMENTOW.inny) : NAZWY_DOKUMENTOW[d.typ];
}

export function tematDokumentu(d: DaneMailaDokumentu): string {
  const nr = `#${d.zamowienieId.slice(0, 8)}`;
  if (d.typ === "faktura") return `Faktura${d.numer ? ` ${d.numer}` : ""} do zamówienia ${nr} — bobas-shopping`;
  if (d.typ === "korekta") return `Korekta faktury${d.dotyczy ? ` ${d.dotyczy}` : ""} — zamówienie ${nr} — bobas-shopping`;
  if (d.typ === "dowod") return `Dowód zakupu — zamówienie ${nr} — bobas-shopping`;
  return `${nazwa(d)}${d.numer ? ` ${d.numer}` : ""} — zamówienie ${nr} — bobas-shopping`;
}

function tabela(wiersze: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;background:${M.tlo};border-radius:12px">${wiersze
    .map(
      ([a, b]) =>
        `<tr><td style="padding:9px 16px;font-size:13.5px;color:${M.ink2};vertical-align:top">${a}</td><td style="padding:9px 16px;font-size:13.5px;font-weight:700;text-align:right;color:${M.ink}">${b}</td></tr>`,
    )
    .join("")}</table>`;
}

export function mailDokumentuHtml(d: DaneMailaDokumentu): string {
  const nr = d.zamowienieId.slice(0, 8);
  const imie = (d.imie ?? "").trim().split(/\s+/)[0];
  const czesc = imie ? `Cześć ${esc(imie)}! ` : "";
  const zam = `<strong style="color:${M.ink}">#${esc(nr)}</strong>`;
  const f = d.faktura;
  const nabywca = f ? `${esc(f.nazwa)}${f.nip ? `<br>NIP ${esc(nipCzytelny(f.nip))}` : ""}` : "";
  // Ramka z plikiem: z linkiem — cała klikalna i otwiera dokument (klienci klikali ją jak załącznik).
  const zalacznik = d.link
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr><td style="border:1px solid ${M.linia};border-radius:10px"><a href="${esc(d.link)}" target="_blank" style="display:block;padding:12px 14px;font-size:13.5px;line-height:1.5;color:${M.ink};text-decoration:none">📎 <strong>${esc(d.nazwaPliku)}</strong><br><span style="color:${M.akcent};font-weight:700;text-decoration:underline">Otwórz dokument →</span> <span style="color:${M.ink2};font-size:12.5px">(plik jest też w załączniku maila)</span></a></td></tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px"><tr><td style="padding:10px 14px;border:1px solid ${M.linia};border-radius:10px;font-size:13.5px;color:${M.ink}">📎 W załączniku: <strong>${esc(d.nazwaPliku)}</strong></td></tr></table>`;
  const dopisek = d.dopisek?.trim()
    ? `<p style="margin:0 0 14px;padding:12px 14px;border-left:3px solid ${M.akcent};background:${M.tlo};font-size:14px;line-height:1.6;color:${M.ink}">${esc(d.dopisek.trim()).replace(/\r?\n/g, "<br>")}</p>`
    : "";
  const notka = (t: string) => `<p style="margin:16px 0 0;font-size:12.5px;line-height:1.6;color:${M.ink2}">${t}</p>`;
  const cta = { tekst: "MOJE ZAMÓWIENIA", url: `${BAZA}/konto/zamowienia` };

  let emoji = "📄";
  let naglowek = nazwa(d);
  let intro = "";
  let wiersze: [string, string][] = [];
  let koniec = "Coś się nie zgadza? Odpisz na tego maila — poprawimy.";

  if (d.typ === "faktura") {
    emoji = "🧾";
    naglowek = "Faktura do Twojego zamówienia";
    intro = `${czesc}W załączniku przesyłamy fakturę do zamówienia ${zam} z ${esc(dzien(d.dataZamowienia))}.`;
    wiersze = [["Dokument", "Faktura VAT"]];
    if (d.numer) wiersze.push(["Numer", esc(d.numer)]);
    if (d.ksef) wiersze.push(["Numer KSeF", esc(d.ksef)]);
    wiersze.push(["Kwota brutto", zl(d.razem)]);
    if (nabywca) wiersze.push(["Nabywca", nabywca]);
    koniec = `${d.ksef ? "Fakturę wystawiliśmy w Krajowym Systemie e-Faktur (KSeF), a plik PDF to jej wizualizacja. " : ""}Coś się nie zgadza na fakturze? Odpisz na tego maila — poprawimy.`;
  } else if (d.typ === "korekta") {
    emoji = "↩️";
    naglowek = "Korekta faktury";
    intro = `${czesc}Przesyłamy fakturę korygującą do zamówienia ${zam}.`;
    wiersze = [["Dokument", "Faktura korygująca"]];
    if (d.numer) wiersze.push(["Numer", esc(d.numer)]);
    if (d.dotyczy) wiersze.push(["Do faktury", esc(d.dotyczy)]);
    if (d.przyczyna) wiersze.push(["Przyczyna", esc(d.przyczyna)]);
    if (typeof d.kwota === "number" && Number.isFinite(d.kwota) && d.kwota !== 0) wiersze.push(["Kwota korekty", zl(d.kwota)]);
    if (d.ksef) wiersze.push(["Numer KSeF", esc(d.ksef)]);
    koniec = "Masz pytania dotyczące korekty? Odpisz na tego maila.";
  } else if (d.typ === "dowod") {
    intro = `${czesc}W załączniku przesyłamy dowód zakupu do zamówienia ${zam}. Zachowaj go — przyda się przy zwrocie lub reklamacji.`;
    wiersze = [
      ["Dokument", "Dowód zakupu"],
      ["Data zakupu", esc(dzien(d.dataZamowienia))],
      ["Kwota", zl(d.razem)],
    ];
    koniec = "Na zwrot masz 14 dni od otrzymania paczki — szczegóły znajdziesz w zakładce Dostawa i zwroty na naszej stronie.";
  } else {
    intro = `${czesc}W załączniku przesyłamy dokument do zamówienia ${zam}.`;
    wiersze = [["Dokument", esc(nazwa(d))]];
    if (d.numer) wiersze.push(["Numer", esc(d.numer)]);
  }

  return powloka({
    emoji,
    naglowek,
    preheader: `${nazwa(d)}${d.numer ? ` ${d.numer}` : ""} do zamówienia #${nr} — w załączniku.`,
    intro,
    tresc: dopisek + tabela(wiersze) + zalacznik + notka(koniec),
    cta,
  });
}
