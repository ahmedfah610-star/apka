import type { Kategoria, Produkt } from "@/data/produkty";
import { znajdzKolekcje, produktyKolekcji } from "@/data/kolekcje";
import { wyszukaj } from "@/lib/filtrowanie";
import { kluczWariantu, zwinWarianty, type Zwiniety } from "@/lib/warianty";

// Produkty wplecione w artykuły bloga: pas kafelków po wybranej sekcji artykułu.
// Dobór jest „na żywo" z katalogu (tylko dostępne, jeden kafel na model), więc
// wyprzedane rzeczy same znikają, a nowe same się pojawiają.

export interface WyborProduktow {
  kolekcja?: string; // slug z data/kolekcje
  fraza?: string; // jak w wyszukiwarce sklepu (nazwa/kolor/rozmiar/kategoria)
  kategoria?: Kategoria;
  rozmiary?: string[]; // co najmniej jeden z tych rozmiarów na stanie
  maxCena?: number;
  dorosli?: boolean; // domyślnie bez odzieży męskiej — blog jest o dzieciach
}

export interface PasProduktow {
  po: string; // tekst nagłówka H2, po którego sekcji wstawiamy pas
  tytul: string;
  link: string;
  linkTekst?: string;
  wybor: WyborProduktow;
}

export const MIN_W_PASIE = 3; // mniej kafelków wygląda ubogo — wtedy pas się nie pokazuje

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

// Trafność: nazwa ZACZYNA się od słowa kluczowego („Body …") > słowo blisko początku > dalej
// (np. „Komplet … bluza body spodnie" to komplet, nie body).
function trafnosc(p: Produkt, slowa: string[]): number {
  if (!slowa.length) return 0;
  const n = norm(p.nazwa);
  const poz = Math.min(...slowa.map((k) => (n.indexOf(k) < 0 ? Infinity : n.indexOf(k))));
  return poz === 0 ? 0 : poz < 16 ? 1 : 2;
}

const naStanie = (p: Produkt) => p.stan == null || p.stan > 0;
const maRozmiar = (p: Produkt, rozmiary: string[]) =>
  (p.rozmiary ?? []).some((r) => rozmiary.includes(String(r)) && (p.stanRozmiary?.[r] == null || (p.stanRozmiary[r] ?? 0) > 0));

export function wybierzProdukty(katalog: Produkt[], w: WyborProduktow, pominModele: Set<string>, ile = 8): Zwiniety[] {
  let lista = katalog.filter((p) => naStanie(p) && (w.dorosli || p.kategoria !== "dorosli"));
  let slowa: string[] = [];
  if (w.kolekcja) {
    const kol = znajdzKolekcje(w.kolekcja);
    lista = kol ? produktyKolekcji(lista, kol) : [];
    slowa = kol?.klucze ?? [];
  }
  if (w.kategoria) lista = lista.filter((p) => p.kategoria === w.kategoria);
  if (w.rozmiary?.length) lista = lista.filter((p) => maRozmiar(p, w.rozmiary!));
  if (w.maxCena != null) lista = lista.filter((p) => p.cena <= w.maxCena!);
  if (w.fraza) {
    const { lista: znalezione, zOpisu } = wyszukaj(lista, w.fraza);
    lista = zOpisu ? [] : znalezione; // tylko trafienia w nazwie/kategorii — opis bywa mylący
    slowa = norm(w.fraza).split(/\s+/).filter((x) => x.length > 2).map((x) => x.slice(0, 5));
  }
  // Kolejność: trafność nazwy, pełniejsza galeria (lepiej wygląda w artykule), nowsze.
  // Pusty wybór = „Nowości": po prostu od najnowszych.
  const nowosci = Object.keys(w).length === 0;
  const posortowane = lista
    .map((p, i) => ({ p, i, t: trafnosc(p, slowa), z: nowosci ? 0 : Math.min(p.zdjecia?.length ?? 0, 3) }))
    .sort((a, b) => a.t - b.t || b.z - a.z || b.i - a.i)
    .map((x) => x.p);
  const wynik: Zwiniety[] = [];
  for (const z of zwinWarianty(posortowane)) {
    const k = kluczWariantu(z.produkt);
    if (pominModele.has(k)) continue;
    wynik.push(z);
    if (wynik.length >= ile) break;
  }
  return wynik.length >= MIN_W_PASIE ? wynik : [];
}

const K = (slug: string) => `/kolekcje/${slug}`;

export const PRODUKTY_W_ARTYKULACH: Record<string, PasProduktow[]> = {
  "ubranka-dla-dziecka-z-wrazliwa-skora": [
    { po: "Jakie materiały wybierać", tytul: "Body niemowlęce", link: K("body-niemowlece"), wybor: { kolekcja: "body-niemowlece" } },
    { po: "Na co zwrócić uwagę przy AZS", tytul: "Pajacyki i śpiochy", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
  ],
  "ubranka-na-wiosne-dla-dziecka": [
    { po: "Baza wiosennej szafy", tytul: "Bluzy na wiosnę", link: "/produkty?szukaj=bluza", wybor: { fraza: "bluza" } },
    { po: "Zimne poranki, ciepłe popołudnia", tytul: "Dresy dziecięce", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "Materiały na wiosnę", tytul: "Komplety na co dzień", link: K("komplety-dzieciece"), wybor: { kolekcja: "komplety-dzieciece" } },
  ],
  "jak-spakowac-dziecko-na-wakacje": [
    { po: "Wakacyjne must-have", tytul: "Krótki rękaw na upały", link: "/produkty?szukaj=kr%C3%B3tki%20r%C4%99kaw", wybor: { fraza: "krótki rękaw" } },
    { po: "Nad morze, w góry czy do miasta", tytul: "Sweterki na chłodny wieczór", link: "/produkty?szukaj=sweter", wybor: { fraza: "sweter" } },
    { po: "Pakuj sprytnie", tytul: "Komplety — gotowe zestawy", link: K("komplety-dzieciece"), wybor: { kolekcja: "komplety-dzieciece" } },
  ],
  "pizama-dla-dziecka-jak-wybrac": [
    { po: "Materiał — miękka, oddychająca bawełna", tytul: "Pajacyki do spania", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
    { po: "Na lato i na zimę", tytul: "Na chłodniejsze noce — ocieplane", link: "/produkty?szukaj=ocieplany", wybor: { fraza: "ocieplany", kategoria: "niemowleta" } },
  ],
  "jak-ubrac-dziecko-na-lato": [
    { po: "Co sprawdza się latem", tytul: "Krótki rękaw na upały", link: "/produkty?szukaj=kr%C3%B3tki%20r%C4%99kaw", wybor: { fraza: "krótki rękaw" } },
    { po: "Ochrona przed słońcem", tytul: "Czapki i kapelusze", link: K("czapki-dzieciece"), wybor: { kolekcja: "czapki-dzieciece" } },
    { po: "Klimatyzacja i chłodniejsze wieczory", tytul: "Lekkie bluzy na wieczór", link: "/produkty?szukaj=bluza", wybor: { fraza: "bluza" } },
  ],
  "bawelna-organiczna-czy-warto": [
    { po: "Kiedy szczególnie warto dopłacić", tytul: "Body niemowlęce", link: K("body-niemowlece"), wybor: { kolekcja: "body-niemowlece" } },
    { po: "Czy trzeba kupować tylko organiczne?", tytul: "Komplety niemowlęce", link: K("komplety-niemowlece"), wybor: { kolekcja: "komplety-niemowlece" } },
  ],
  "jak-ubrac-dziecko-na-zime": [
    { po: "Zasada trzech warstw", tytul: "Body na pierwszą warstwę", link: K("body-dzieciece"), wybor: { kolekcja: "body-dzieciece" } },
    { po: "Kompletna zimowa szafa", tytul: "Ciepłe dresy i bluzy", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "Jak sprawdzić, czy dziecku jest ciepło", tytul: "Czapki na chłodne dni", link: K("czapki-dzieciece"), wybor: { kolekcja: "czapki-dzieciece" } },
  ],
  "body-czy-pajacyk-dla-noworodka": [
    { po: "Kiedy sprawdza się body", tytul: "Body niemowlęce", link: K("body-niemowlece"), wybor: { kolekcja: "body-niemowlece" } },
    { po: "Kiedy lepszy pajacyk", tytul: "Pajacyki i śpiochy", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
    { po: "Co kupić na start i w jakich proporcjach", tytul: "Komplety na start", link: K("komplety-niemowlece"), wybor: { kolekcja: "komplety-niemowlece" } },
  ],
  "wyprawka-do-szpitala-lista": [
    { po: "Ubranka i rzeczy dla dziecka", tytul: "Do szpitala: rozmiar 56–62", link: "/produkty?kategoria=niemowleta", wybor: { kategoria: "niemowleta", rozmiary: ["50", "56", "62"] } },
    { po: "W jakim rozmiarze pakować", tytul: "Czapeczki dla noworodka", link: K("czapki-niemowlece"), wybor: { kolekcja: "czapki-niemowlece" } },
  ],
  "ile-ubranek-potrzebuje-niemowle": [
    { po: "Rozmiar 56–62 (pierwsze tygodnie)", tytul: "Na stanie w rozmiarach 56–62", link: "/produkty?kategoria=niemowleta", wybor: { kategoria: "niemowleta", rozmiary: ["56", "62"] } },
    { po: "Rozmiar 68–74 (ok. 3–9 miesięcy)", tytul: "Na stanie w rozmiarach 68–74", link: "/produkty?kategoria=niemowleta", wybor: { kategoria: "niemowleta", rozmiary: ["68", "74"] } },
    { po: "Rozmiar 80–86 i wyżej (ok. 9–18 miesięcy)", tytul: "Na stanie w rozmiarach 80–86", link: "/produkty?kategoria=niemowleta", wybor: { rozmiary: ["80", "86"] } },
  ],
  "jak-ubrac-dziecko-na-chrzest": [
    { po: "Elegancja i wygoda — złoty środek", tytul: "Sweterki i kamizelki", link: "/produkty?szukaj=sweter", wybor: { fraza: "sweter", kategoria: "niemowleta" } },
    { po: "Dla dziewczynki", tytul: "Sukienki", link: "/produkty?szukaj=sukienka", wybor: { fraza: "sukienka" } },
    { po: "Dla chłopca", tytul: "Eleganckie ubranka", link: "/produkty?szukaj=elegancki", wybor: { fraza: "elegancki" } },
  ],
  "7-bledow-przy-kupowaniu-ubranek-dla-dzieci": [
    { po: "5. Stawianie wyglądu ponad wygodę", tytul: "Wygodne dresy", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "6. Pomijanie zapięć, które ułatwiają życie", tytul: "Pajacyki i śpiochy", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
  ],
  "prezent-dla-noworodka-pomysly": [
    { po: "Ubranka, które zawsze się przydają", tytul: "Komplety na prezent", link: K("komplety-niemowlece"), wybor: { kolekcja: "komplety-niemowlece" } },
    { po: "Prezent „na wyrost” — zawsze trafiony", tytul: "Na wyrost: rozmiary 74–86", link: "/produkty?kategoria=niemowleta", wybor: { kategoria: "niemowleta", rozmiary: ["74", "80", "86"] } },
  ],
  "ubranka-na-jesien-dla-dziecka": [
    { po: "Baza jesiennej szafy", tytul: "Bluzy na jesień", link: "/produkty?szukaj=bluza", wybor: { fraza: "bluza" } },
    { po: "Do żłobka i przedszkola", tytul: "Dresy dziecięce", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "Materiały na jesień", tytul: "Czapki na chłodniejsze dni", link: K("czapki-dzieciece"), wybor: { kolekcja: "czapki-dzieciece" } },
  ],
  "jak-zaoszczedzic-na-ubrankach-dzieciecych": [
    { po: "Stawiaj na uniwersalne, łatwe do łączenia rzeczy", tytul: "Komplety dziecięce", link: K("komplety-dzieciece"), wybor: { kolekcja: "komplety-dzieciece" } },
    { po: "Poluj na końcówki serii i sezonowe okazje", tytul: "Do 20 zł", link: "/produkty?cena=do-20", wybor: { maxCena: 20 } },
  ],
  "co-znacza-metki-ubranek-dzieciecych": [
    { po: "Skład materiału — na co patrzeć", tytul: "Body dziecięce", link: K("body-dzieciece"), wybor: { kolekcja: "body-dzieciece" } },
  ],
  "jak-dobrac-rozmiar-ubranka-dla-dziecka": [
    { po: "Gdy dziecko jest „pomiędzy” rozmiarami", tytul: "Dresy — wygodne z zapasem", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "Jak korzystać z tabeli rozmiarów w naszym sklepie", tytul: "Nowości w sklepie", link: "/produkty?sort=nowosci", wybor: {} },
  ],
  "wyprawka-dla-noworodka-lista-ubranek": [
    { po: "Ubranka na start (rozmiar 56–68)", tytul: "Body niemowlęce", link: K("body-niemowlece"), wybor: { kolekcja: "body-niemowlece" } },
    { po: "Co spakować do szpitala", tytul: "Pajacyki i śpiochy", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
    { po: "Na co zwrócić uwagę przy zakupie", tytul: "Czapeczki niemowlęce", link: K("czapki-niemowlece"), wybor: { kolekcja: "czapki-niemowlece" } },
  ],
  "jak-ubierac-niemowle-warstwy-pory-roku": [
    { po: "Lato", tytul: "Body niemowlęce", link: K("body-niemowlece"), wybor: { kolekcja: "body-niemowlece" } },
    { po: "Zima", tytul: "Pajacyki i śpiochy", link: K("pajacyki-i-spiochy-niemowlece"), wybor: { kolekcja: "pajacyki-i-spiochy-niemowlece" } },
    { po: "Dni przejściowe (wiosna i jesień)", tytul: "Komplety niemowlęce", link: K("komplety-niemowlece"), wybor: { kolekcja: "komplety-niemowlece" } },
  ],
  "ubranka-do-zlobka-i-przedszkola": [
    { po: "Co się sprawdza", tytul: "Dresy do przedszkola", link: K("dresy-dzieciece"), wybor: { kolekcja: "dresy-dzieciece" } },
    { po: "Praktyczne drobiazgi, które robią różnicę", tytul: "Legginsy i spodnie", link: "/produkty?szukaj=legginsy", wybor: { fraza: "legginsy" } },
  ],
  "jak-prac-i-dbac-o-ubranka-dzieciece": [
    { po: "Suszenie i trwałość", tytul: "Nowości w sklepie", link: "/produkty?sort=nowosci", wybor: {} },
  ],
};

export function pasyDlaArtykulu(slug: string): PasProduktow[] {
  return PRODUKTY_W_ARTYKULACH[slug] ?? [];
}
