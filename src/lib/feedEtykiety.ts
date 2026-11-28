import type { Produkt } from "@/data/produkty";
import { ZDJECIA_REKLAMOWE } from "@/data/zdjeciaReklamowe";

// Etykiety do kampanii Google Ads (custom_label_1..3 w pliku produktowym). Dzięki nim kampanię
// ustawia się RAZ i steruje nią wyłączaniem grup produktów, bez tworzenia nowych kampanii:
//  - cena:  kliknięcie kosztuje tyle samo przy body za 10 zł i komplecie za 55 zł — reklamujemy droższe
//           (cena-40plus / cena-20-40 / cena-ponizej-20),
//  - stan:  pojedyncza sztuka wyprzedaje się po jednej sprzedaży — reklama dalej płaci za kliknięcia,
//  - dział: dziecięce i męskie to inni kupujący i inne stawki.
export const PROG_CENY_REKLAMY = 40;
export const PROG_TANICH = 20; // poniżej — najtańsze (do wykluczenia z kampanii)
export const PROG_STANU_REKLAMY = 3;

/** Sztuki na stanie łącznie (wszystkie rozmiary). */
export function sztukNaStanie(p: Pick<Produkt, "stan" | "stanRozmiary">): number {
  if (p.stanRozmiary) return Object.values(p.stanRozmiary).reduce((s, n) => s + (Number(n) || 0), 0);
  return Number(p.stan ?? 0) || 0;
}

export function etykietyReklamowe(p: Pick<Produkt, "cena" | "kategoria" | "stan" | "stanRozmiary">): { cena: string; stan: string; dzial: string } {
  return {
    cena: p.cena >= PROG_CENY_REKLAMY ? "cena-40plus" : p.cena >= PROG_TANICH ? "cena-20-40" : "cena-ponizej-20",
    stan: sztukNaStanie(p) >= PROG_STANU_REKLAMY ? "stan-3plus" : "stan-1-2",
    dzial: p.kategoria === "dorosli" ? "meskie" : "dzieciece",
  };
}

/** Zdjęcia do pliku produktowego: wybrane ujęcie reklamowe jako pierwsze (jeśli nadal jest w galerii). */
export function zdjeciaDoReklamy(p: Pick<Produkt, "id" | "zdjecie" | "zdjecia">, wybrane: Record<string, string> = ZDJECIA_REKLAMOWE): { zdjecia: string[]; top: boolean } {
  const galeria = (p.zdjecia?.length ? p.zdjecia : p.zdjecie ? [p.zdjecie] : []).filter(Boolean) as string[];
  const najlepsze = wybrane[p.id];
  if (!najlepsze) return { zdjecia: galeria, top: false };
  // Zdjęcie zniknęło z galerii (np. po ponownym imporcie) — zostaje zdjęcie główne, bez etykiety „top".
  if (!galeria.includes(najlepsze)) return { zdjecia: galeria, top: false };
  return { zdjecia: [najlepsze, ...galeria.filter((u) => u !== najlepsze)], top: true };
}

/**
 * Tytuł do pliku dla Google (sklep zostaje bez zmian). Cienkie swetry męskie, które w nazwie z Allegro
 * nie mają słowa „cienki” (a w opisie tak), dostają je w tytule — klienci szukają np. „cienki sweter
 * męski rozpinany” i to hasło już sprzedawało. Ciepłych modeli (ocieplane, polar, futerko) nie ruszamy.
 */
export function tytulDoFeedu(p: Pick<Produkt, "nazwa" | "opis" | "kategoria">): string {
  const n = p.nazwa;
  const cienkiWOpisie = /cienk/i.test((p.opis ?? "").slice(0, 400));
  if (p.kategoria !== "dorosli" || !/sweter/i.test(n) || /cienk/i.test(n) || !cienkiWOpisie || /ociepl|podszyt|polar|futer/i.test(n)) return n;
  const m = n.match(/^(sweter męski|męski sweter)\s+/i);
  return m ? `${m[0]}cienki ${n.slice(m[0].length)}` : `Cienki ${n.charAt(0).toLowerCase()}${n.slice(1)}`;
}

// ── Tytuły dla bezpłatnych wyników Zakupów Google (i katalogu Meta) ───────────
// Nazwa w sklepie i na Allegro zostaje bez zmian — zmienia się tylko <g:title> w pliku produktowym.
// Dopisujemy wyłącznie PEWNE fakty: dla kogo (z działu i rozmiarów), „na zimę” (swetry, sweterkowe
// kamizelki, czapki z pomponem, kombinezony), kolor (tylko potwierdzony na zdjęciu) i rozmiar pozycji.
// Plus porządki: „T-shirt”, bez Wielkich Liter W Środku i CAPSA, cudzysłowy „…”, bez haseł promocyjnych.

const normT = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

const ODBIORCA_W_NAZWIE = /niemowl|noworod|wczesniak|dla dzieci|dzieci|dzieck|dziewczyn|dziewcz|chlopc|chlopiec|chlopie|mesk|mezczyz|maluch/;
const TYPY = ["body", "czapk", "sweter", "kamizelk", "spodnie", "legginsy", "pajac", "komplet", "bluz", "sukienk", "dres", "polspiochy", "spiochy", "skarpet", "kombinezon", "getry", "t-shirt", "spodenki", "kolarki", "opaska", "ubranko", "wyprawka", "golf", "dzwony"];
const NAPIS = /babci|dziadk|dziadek|tatus|prezes|kocham/;
// Google odrzuca tytuły z hasłami promocyjnymi — gdyby trafiły się w nazwie z Allegro.
const PROMO = /\s*(!+|\b(promocja|promocyjna|okazja|wyprzedaż|gratis|darmowa dostawa|hit|nowość)\b)/giu;

/** Nazwa po porządkach (bez zmiany treści). */
export function uporzadkujNazwe(nazwa: string): string {
  let t = nazwa.replace(/\s+/g, " ").trim();
  t = t.replace(/\bt[ -]?shirt\b/gi, "T-shirt");
  t = t.replace(/"\s*([^"]+?)\s*"/g, "„$1”");
  t = t.replace(PROMO, "").replace(/\s+/g, " ").trim();
  t = t
    .split(" ")
    .map((s, i) => {
      if (i === 0 || s === "T-shirt" || s.startsWith("„")) return s;
      const rdzen = s.replace(/[.,;:)]+$/u, "");
      if (rdzen.length > 2 && /^\p{Lu}+$/u.test(rdzen)) return s.toLowerCase(); // CAPS
      if (rdzen.length > 1 && /^\p{Lu}\p{Ll}+$/u.test(rdzen)) return s.toLowerCase(); // Wielka Litera W Środku
      return s;
    })
    .join(" ");
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** „niebieski (granatowy)” → „granatowy”; „szary (gołębi)” → „szary gołębi”; null = nie dopisujemy. */
export function kolorDoTytulu(kolor: string | null | undefined): string | null {
  if (!kolor) return null;
  const m = /^([^()]+)\(([^)]+)\)\s*$/.exec(kolor.trim());
  const baza = (m ? m[1] : kolor).trim().toLowerCase();
  let k = (m ? m[2] : kolor).trim().toLowerCase();
  if (k === "inny" || k === "wielokolorowy") return null;
  if (k === "chaber") k = "chabrowy";
  if (m && ["gołębi", "neonowy", "siwy", "srebrny", "ecru"].includes(k) && !["biały", "beżowy"].includes(baza)) k = `${baza} ${k}`;
  return k;
}

/** Czy nazwa już mówi o tym kolorze (szary/szara, biały/biała; krótkie „róż”, „beż” — całe słowo). */
function kolorWNazwie(nazwa: string, kolor: string): boolean {
  const slowa: string[] = normT(nazwa).match(/[a-z]+/g) ?? [];
  return normT(kolor)
    .split(/\s+/)
    .some((k) => (k.length <= 4 ? slowa.includes(k) : slowa.some((w) => w.startsWith(k.slice(0, 4)))));
}

/**
 * Tytuł pozycji w pliku produktowym. `rozmiar` = rozmiar tej pozycji (każdy rozmiar to osobna pozycja).
 * `zweryfikowane` = kolory potwierdzone na zdjęciach; `bezZmian` = produkty, których tytułu nie ruszamy.
 */
export function tytulGoogle(
  p: Pick<Produkt, "id" | "nazwa" | "opis" | "kategoria" | "kolor" | "rozmiary">,
  rozmiar: string | undefined,
  zweryfikowane: Record<string, string>,
  bezZmian: Set<string>,
): string {
  const bazowy = tytulDoFeedu(p);
  if (bezZmian.has(p.id)) return bazowy;
  let t = uporzadkujNazwe(bazowy);
  const x = normT(t);

  // Dla kogo — gdy nazwa tego nie mówi. Niemowlęta z rozmiarami ponad 86 → „dla dziecka”.
  let odbiorca: string | null = p.kategoria === "niemowleta" ? "dla niemowlaka" : p.kategoria === "dziewczynki" ? "dla dziewczynki" : p.kategoria === "chlopcy" ? "dla chłopca" : null;
  if (p.kategoria === "niemowleta") {
    const liczby = (p.rozmiary ?? []).flatMap((r) => (r.match(/\d+/g) ?? []).map(Number));
    const max = liczby.length ? Math.max(...liczby) : 0;
    if (max > 86 && max < 200) odbiorca = "dla dziecka";
  }
  if (odbiorca && !ODBIORCA_W_NAZWIE.test(x)) {
    const slowa = t.split(" ");
    const poz = slowa.slice(0, 3).findIndex((s) => TYPY.some((ty) => normT(s).startsWith(ty)));
    // Przy napisach („Babcia tu była”) zaraz po rodzaju ubranka — inaczej „…tu była dla niemowlaka”.
    if (NAPIS.test(x) && poz >= 0) {
      slowa.splice(poz + 1, 0, odbiorca);
      t = slowa.join(" ");
    } else t = `${t} ${odbiorca}`;
  }

  // „na zimę” — tylko rzeczy z natury zimowe, bez cienkich, lekkich i przejściowych.
  if (/sweter|sweterk|pompon|kombinezon/.test(x) && !/zim|ciepl|ociepl|polar|welur|meszk|futer|kozusz/.test(x) && !/cienk|lekk|przejsciow/.test(x)) {
    t = `${t} na zimę`;
  }

  const dopiski: string[] = [];
  // Kolor — wyłącznie potwierdzony na zdjęciu i niezmieniony od sprawdzenia.
  const k = p.kolor && zweryfikowane[p.id] === p.kolor ? kolorDoTytulu(p.kolor) : null;
  if (k && !kolorWNazwie(t, k)) dopiski.push(`kolor ${k}`);
  const r = (rozmiar ?? "").replace(/^[\s,;.]+|[\s,;.]+$/g, "");
  if (r && !new RegExp(`(?<!\\d)${r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\d)`).test(t)) dopiski.push(`rozm. ${r}`);

  const ogon = dopiski.length ? ` – ${dopiski.join(", ")}` : "";
  if (t.length + ogon.length > 150) t = t.slice(0, 150 - ogon.length).replace(/\s+\S*$/, "");
  return t + ogon;
}
