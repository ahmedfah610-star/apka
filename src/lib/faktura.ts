// Faktura do zamówienia: dane nabywcy (z formularza zamówienia albo dopisane w panelu)
// i dokumenty wysłane klientowi. Bez nowej tabeli — wszystko w kolumnie `klient` zamówienia:
//   klient.faktura   — dane do faktury (DaneFaktury),
//   klient.dokumenty — wgrane dokumenty (faktura, korekta, dowód zakupu…) z historią wysyłek.
// Plik bez zależności serwerowych: ta sama walidacja w przeglądarce i na serwerze.

export type TypNabywcy = "firma" | "osoba";

export interface DaneFaktury {
  typ: TypNabywcy;
  nip?: string; // 10 cyfr, bez kresek (tylko firma)
  nazwa: string; // firma: nazwa; osoba: imię i nazwisko
  adres: string; // ulica i numer
  kod: string; // 00-000
  miasto: string;
  kraj: "PL"; // sklep wysyła tylko w Polsce
  email?: string; // inny e-mail na fakturę (np. księgowość)
  uwagi?: string; // uwagi do faktury od klienta
}

export type TypDokumentu = "faktura" | "korekta" | "dowod" | "inny";

export interface WysylkaDokumentu {
  czas: string;
  do: string[];
}

export interface DokumentZamowienia {
  id: string;
  typ: TypDokumentu;
  numer?: string; // numer faktury / korekty
  ksef?: string; // numer KSeF (opcjonalnie)
  nazwaDokumentu?: string; // dla „inny" (np. „Duplikat faktury")
  dotyczy?: string; // korekta: numer korygowanej faktury
  przyczyna?: string; // korekta: przyczyna
  kwota?: number; // korekta: kwota korekty (zł, ujemna = zwrot)
  plik: string; // ścieżka w prywatnym magazynie plików
  nazwaPliku: string;
  rozmiar: number;
  mime: string;
  czas: string; // kiedy wgrano
  wysylki?: WysylkaDokumentu[];
}

export const NAZWY_DOKUMENTOW: Record<TypDokumentu, string> = {
  faktura: "Faktura VAT",
  korekta: "Faktura korygująca",
  dowod: "Dowód zakupu",
  inny: "Dokument",
};

export const MAX_UWAGI_FAKTURY = 300;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

const czysc = (s: unknown, max: number): string =>
  typeof s === "string"
    ? s
        .replace(/[<>]/g, "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .replace(/[ \t]+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Sama cyfry NIP (bez spacji, kresek i prefiksu „PL"). */
export function normalizujNip(nip: unknown): string {
  return String(nip ?? "")
    .toUpperCase()
    .replace(/^PL/, "")
    .replace(/[\s-]/g, "");
}

/** NIP: 10 cyfr i poprawna cyfra kontrolna. */
export function nipPoprawny(nip: unknown): boolean {
  const n = normalizujNip(nip);
  if (!/^\d{10}$/.test(n) || /^0+$/.test(n)) return false;
  const wagi = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const suma = wagi.reduce((s, w, i) => s + w * Number(n[i]), 0);
  const kontrolna = suma % 11;
  return kontrolna !== 10 && kontrolna === Number(n[9]);
}

/** „9462681345" → „946-268-13-45" (zapis na fakturze i w panelu). */
export function nipCzytelny(nip: string): string {
  const n = normalizujNip(nip);
  return /^\d{10}$/.test(n) ? `${n.slice(0, 3)}-${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8)}` : nip;
}

/** Kod pocztowy: „20001" i „20 001" → „20-001"; inne formaty zostają (walidacja je odrzuci). */
export function normalizujKod(kod: unknown): string {
  const k = String(kod ?? "").replace(/\s/g, "");
  return /^\d{5}$/.test(k) ? `${k.slice(0, 2)}-${k.slice(2)}` : k;
}

/**
 * Walidacja danych do faktury (formularz zamówienia, panel). Zwraca oczyszczone dane albo
 * pierwszy błąd do pokazania klientowi. `null`/brak = klient nie chce faktury.
 */
export function sprawdzFakture(we: unknown): { ok: true; faktura: DaneFaktury | null } | { ok: false; blad: string } {
  if (we === null || we === undefined || we === false) return { ok: true, faktura: null };
  if (typeof we !== "object") return { ok: false, blad: "Nieprawidłowe dane do faktury." };
  const z = we as Record<string, unknown>;
  const typ: TypNabywcy = z.typ === "firma" ? "firma" : "osoba";
  const nazwa = czysc(z.nazwa, 200);
  const adres = czysc(z.adres, 200);
  const kod = normalizujKod(czysc(z.kod, 12));
  const miasto = czysc(z.miasto, 80);
  const email = czysc(z.email, 160).toLowerCase();
  const uwagi = czysc(typeof z.uwagi === "string" ? z.uwagi.replace(/\r\n/g, "\n") : z.uwagi, MAX_UWAGI_FAKTURY);

  let nip: string | undefined;
  if (typ === "firma") {
    nip = normalizujNip(z.nip);
    if (!nip) return { ok: false, blad: "Podaj NIP firmy do faktury." };
    if (!nipPoprawny(nip)) return { ok: false, blad: "NIP jest nieprawidłowy — sprawdź cyfry." };
    if (nazwa.length < 2) return { ok: false, blad: "Podaj nazwę firmy do faktury." };
  } else if (nazwa.length < 3) {
    return { ok: false, blad: "Podaj imię i nazwisko do faktury." };
  }
  if (adres.length < 3) return { ok: false, blad: "Podaj ulicę i numer do faktury." };
  if (!/^\d{2}-\d{3}$/.test(kod)) return { ok: false, blad: "Kod pocztowy do faktury w formacie 00-000." };
  if (miasto.length < 2) return { ok: false, blad: "Podaj miejscowość do faktury." };
  if (email && !EMAIL.test(email)) return { ok: false, blad: "E-mail do faktury jest nieprawidłowy." };

  return {
    ok: true,
    faktura: { typ, ...(nip ? { nip } : {}), nazwa, adres, kod, miasto, kraj: "PL", ...(email ? { email } : {}), ...(uwagi ? { uwagi } : {}) },
  };
}

type ZamowienieDoFaktury = {
  status: string;
  klient?: { faktura?: DaneFaktury | null; dokumenty?: DokumentZamowienia[] | null; test?: boolean } | null;
};

const OPLACONE = ["oplacone", "wyslane", "nowe"];

/** brak — klient nie chce faktury; do-wystawienia — opłacone, faktury jeszcze nie ma; gotowa — faktura wgrana. */
export function stanFaktury(z: ZamowienieDoFaktury): "brak" | "do-wystawienia" | "gotowa" | "czeka" {
  const f = z.klient?.faktura;
  if (!f) return "brak";
  if ((z.klient?.dokumenty ?? []).some((d) => d.typ === "faktura")) return "gotowa";
  return OPLACONE.includes(z.status) ? "do-wystawienia" : "czeka"; // czeka — np. na płatność
}

/** Ile faktur czeka na wystawienie (bez zamówień testowych). */
export function fakturDoWystawienia(lista: ZamowienieDoFaktury[]): { razem: number; firmy: number; osoby: number } {
  const do_ = lista.filter((z) => !z.klient?.test && stanFaktury(z) === "do-wystawienia");
  const firmy = do_.filter((z) => z.klient?.faktura?.typ === "firma").length;
  return { razem: do_.length, firmy, osoby: do_.length - firmy };
}

const zl = (n: number) => `${Number(n || 0).toFixed(2).replace(".", ",")} zł`;

/** Wszystko do wklejenia w program do faktur: nabywca, pozycje, dostawa, rabat, płatność. */
export function tekstDoFaktury(z: {
  id: string;
  data: string;
  pozycje: { nazwa: string; cena: number; ilosc: number; rozmiar?: string | null; kolor?: string | null }[];
  dostawa: number;
  razem: number;
  rabat?: number;
  kodRabatowy?: string | null;
  metoda?: string | null;
  status: string;
  wyslanoAt?: string | null;
  klient?: { faktura?: DaneFaktury | null } | null;
}): string {
  const f = z.klient?.faktura;
  const dzien = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
  const linie: string[] = [];
  if (f) {
    linie.push(`NABYWCA (${f.typ === "firma" ? "firma" : "osoba prywatna"})`, f.nazwa);
    if (f.nip) linie.push(`NIP: ${nipCzytelny(f.nip)}`);
    linie.push(f.adres, `${f.kod} ${f.miasto}`, "Polska");
    if (f.email) linie.push(`E-mail na fakturę: ${f.email}`);
    if (f.uwagi) linie.push(`Uwagi do faktury: ${f.uwagi}`);
    linie.push("");
  }
  linie.push(`ZAMÓWIENIE #${z.id.slice(0, 8)} z ${dzien(z.data)}`);
  for (const p of z.pozycje) {
    const opis = [p.nazwa, p.kolor ? `kolor ${p.kolor}` : "", p.rozmiar ? `rozm. ${p.rozmiar}` : ""].filter(Boolean).join(", ");
    linie.push(`- ${opis} — ${p.ilosc} szt. × ${zl(p.cena)} = ${zl(p.cena * p.ilosc)}`);
  }
  if (z.rabat && z.rabat > 0) linie.push(`- Rabat${z.kodRabatowy ? ` (kod ${z.kodRabatowy})` : ""}: −${zl(z.rabat)}`);
  const dostawa = (z.metoda ?? "").replace(/\s*·\s*(Przelewy24|Stripe)\s*$/i, "");
  linie.push(`- Dostawa${dostawa ? ` (${dostawa})` : ""}: ${zl(z.dostawa)}`);
  linie.push(`RAZEM: ${zl(z.razem)}`);
  linie.push("");
  linie.push(`Płatność: ${/stripe/i.test(z.metoda ?? "") ? "Stripe" : "Przelewy24"}${OPLACONE.includes(z.status) && z.status !== "nowe" ? " — zapłacono" : ""}`);
  linie.push(`Data sprzedaży (wysyłki): ${z.wyslanoAt ? dzien(z.wyslanoAt) : "— (jeszcze nie wysłano)"}`);
  return linie.join("\n");
}

/** Nazwa pliku bez znaków, które psują załączniki i ścieżki. */
export function bezpiecznaNazwaPliku(nazwa: string, domyslna = "dokument"): string {
  const s = String(nazwa || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(-80);
  return s || domyslna;
}

/** Nazwa załącznika dla klienta: „Faktura_FV_12_11_2026.pdf", „Dowod_zakupu_31d013de.pdf"… */
export function nazwaPlikuDokumentu(typ: TypDokumentu, numer: string | undefined, zamowienieId: string, rozszerzenie: string): string {
  const przedrostek = typ === "dowod" ? "Dowod_zakupu" : typ === "korekta" ? "Korekta" : typ === "faktura" ? "Faktura" : "Dokument";
  const nr = (numer ?? "").trim();
  return `${bezpiecznaNazwaPliku(nr ? `${przedrostek}_${nr}` : `${przedrostek}_${zamowienieId.slice(0, 8)}`)}.${rozszerzenie}`;
}
