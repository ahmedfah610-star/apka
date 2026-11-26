import type { Produkt } from "@/data/produkty";

// Sezon zimowy: ciepłe rzeczy wyżej na stronie głównej, na listach („polecane"), w menu
// i w feedzie Google (custom_label_0 = "zima" — osobne stawki w Google Ads).
// Włącza i wyłącza się sam: od 1 października do końca lutego (czas polski).

export const SLUG_ZIMA = "ubranka-na-zime";
/** Strona prezentowa pokazywana w menu w sezonie prezentów (od 15 listopada do Wigilii). */
export const SLUG_PREZENTY = "prezent-na-mikolajki-i-swieta";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

/** Słowa w nazwie, po których poznajemy ciepłe rzeczy (po normalizacji: bez ogonków, „ł" → „l"). */
export const SLOWA_CIEPLE = [
  "ociepl", "ciepl", "zimow", "zima", "polar", "welur", "sweter", "kurtk", "czapk", "szalik", "rekawicz",
  "kombinezon", "meszk", "futer", "kozusz", "softshell", "kominiark", "plaszcz", "bezrekawnik", "kamizelk", "dzianin",
];
// …chyba że nazwa mówi wprost o czymś letnim.
const SLOWA_LETNIE = ["krotki rekaw", "krotkim rekawem", "t shirt", "t-shirt", "szort", "letni", "na lato"];

export function czyCieply(p: Pick<Produkt, "nazwa">): boolean {
  const n = norm(p.nazwa);
  return SLOWA_CIEPLE.some((s) => n.includes(s)) && !SLOWA_LETNIE.some((s) => n.includes(s));
}

const MIESIACE_ZIMOWE = new Set([10, 11, 12, 1, 2]);

export function sezonZimowy(teraz: Date = new Date()): boolean {
  const miesiac = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", month: "numeric" }).format(teraz));
  return MIESIACE_ZIMOWE.has(miesiac);
}

/** Ciepłe na początek (kolejność w obu grupach bez zmian). */
export function cieplePierwsze<T extends Pick<Produkt, "nazwa">>(lista: T[]): T[] {
  return [...lista.filter((p) => czyCieply(p)), ...lista.filter((p) => !czyCieply(p))];
}

/** Sezon prezentowy (Mikołajki i Święta): od 15 listopada do 24 grudnia włącznie, czas polski. */
export function sezonPrezentowy(teraz: Date = new Date()): boolean {
  const [m, d] = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", month: "numeric", day: "numeric" })
    .format(teraz)
    .split("/")
    .map(Number);
  return (m === 11 && d >= 15) || (m === 12 && d <= 24);
}
