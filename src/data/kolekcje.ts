import type { Kategoria, Produkt } from "@/data/produkty";
import { czyCieply, SLUG_ZIMA } from "@/lib/sezon";

// Strony docelowe (landing pages) pod frazy sprzedażowe. Każda ma własny URL,
// tytuł, nagłówek H1, opis SEO, treść i FAQ (rich results) oraz listę produktów
// dopasowaną po nazwie/kategorii. Cel: wysokie pozycje na konkretne zapytania.

export interface Kolekcja {
  slug: string;
  h1: string;
  tytul: string; // meta title (bez sufiksu marki — dokłada go szablon)
  opis: string; // meta description
  wstep: string; // akapit widoczny na stronie (unikalna treść SEO)
  kategoria: Kategoria | null;
  klucze: string[]; // dopasowanie po nazwie produktu (znormalizowane, małe litery)
  dopasuj?: (p: Produkt) => boolean; // własna reguła zamiast kluczy (np. ciepłe ubranka na zimę)
  faq: { q: string; a: string }[];
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

/** Produkty pasujące do kolekcji (kategoria + słowo w nazwie). */
export function produktyKolekcji(produkty: Produkt[], kol: Kolekcja): Produkt[] {
  return produkty.filter((p) => {
    if (kol.kategoria && p.kategoria !== kol.kategoria) return false;
    if (kol.dopasuj) return kol.dopasuj(p);
    // Kolekcje „dziecięce" bez działu (dresy, komplety, body, czapki) — bez odzieży męskiej.
    if (!kol.kategoria && p.kategoria === "dorosli") return false;
    const n = norm(p.nazwa);
    return kol.klucze.some((k) => n.includes(k));
  });
}

export function znajdzKolekcje(slug: string): Kolekcja | undefined {
  return KOLEKCJE.find((k) => k.slug === slug);
}

const FAQ_ROZMIAR = {
  q: "Jak dobrać rozmiar?",
  a: "Rozmiar odpowiada wzrostowi dziecka w centymetrach (np. 92 = ok. 92 cm wzrostu). Zmierz dziecko i wybierz najbliższy rozmiar; jeśli jest pomiędzy — weź większy. Na karcie każdego produktu znajdziesz tabelę rozmiarów.",
};
const FAQ_ROZMIAR_MESKI = {
  q: "Jak dobrać rozmiar?",
  a: "Najpewniej po wymiarach: na karcie produktu przy każdym rozmiarze podajemy wymiary w centymetrach. Zmierz na płasko ulubiony sweter, bluzę lub spodnie i porównaj. Jeśli jesteś między rozmiarami — wybierz większy.",
};
const FAQ_DUZE_ROZMIARY = {
  q: "Czy są duże rozmiary?",
  a: "Tak. Wiele modeli mamy w rozmiarach od M do 3XL, a wybrane także w 4XL, 5XL, 6XL i 7XL. Dostępne rozmiary widać na karcie każdego produktu.",
};
const FAQ_DOSTAWA = {
  q: "Jak szybko dotrze zamówienie?",
  a: "Wysyłamy w 1–2 dni robocze przez InPost, ORLEN Paczka, DPD lub DHL. Darmowa dostawa od {darmowaOd}, a na zwrot masz 14 dni.",
};

// Rozmiary 3XL i większe (także łączone, np. „2XL/3XL").
const DUZY_ROZMIAR = /(^|\/)[3-7]XL$/i;

export const KOLEKCJE: Kolekcja[] = [
  // ── Sezon ────────────────────────────────────────────────────────────────
  {
    slug: SLUG_ZIMA,
    h1: "Ubranka na zimę dla dzieci",
    tytul: "Ciepłe ubranka na zimę dla dzieci i niemowląt",
    opis: "Ciepłe ubranka na zimę: sweterki, ocieplane spodnie i dresy, welurowe komplety, czapki i kamizelki dla niemowląt i dzieci. Wysyłka w 1–2 dni, 14 dni na zwrot.",
    wstep:
      "Zimą liczy się ciepło bez przegrzewania. Zebraliśmy tu ciepłe ubranka dla niemowląt i dzieci: sweterki i kamizelki z dzianiny, spodnie ocieplane meszkiem i polarem, welurowe komplety oraz czapki na chłodne dni. Ubieraj malucha na cebulkę — cienka warstwa przy skórze, sweterek lub bluza, a na spacer czapka. Przy każdym rozmiarze podajemy wymiary w centymetrach, a paczki wysyłamy w 1–2 dni robocze.",
    kategoria: null,
    klucze: ["zima", "zimowe", "cieple", "ocieplane", "sweter"], // tylko do wyszukiwarki — produkty wybiera `dopasuj`
    dopasuj: (p) => p.kategoria !== "dorosli" && czyCieply(p),
    faq: [
      {
        q: "Jak ubrać dziecko na zimowy spacer?",
        a: "Na cebulkę: body lub koszulka przy skórze, na to sweterek albo ciepła bluza, ocieplane spodnie, a na wierzch kurtka lub kombinezon i czapka zakrywająca uszy. Sprawdzaj karczek dziecka — ciepły i suchy oznacza, że jest mu dobrze.",
      },
      FAQ_ROZMIAR,
      FAQ_DOSTAWA,
    ],
  },
  // ── Chłopcy ──────────────────────────────────────────────────────────────
  {
    slug: "spodnie-dla-chlopca",
    h1: "Spodnie dla chłopca",
    tytul: "Spodnie dla chłopca 0–12 lat",
    opis: "Spodnie dla chłopca — dresowe, sportowe i na co dzień. Wygodna gumka w pasie, miękkie tkaniny, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Szukasz spodni dla chłopca, które wytrzymają bieganie, plac zabaw i częste pranie? W tej kolekcji znajdziesz spodnie dresowe i sportowe z miękką gumką w pasie, która nie uciska brzuszka. Wygodne fasony sprawdzają się do przedszkola, szkoły i na wyjście — a rozmiary od 62 do 170 pozwalają dobrać je dla malucha i starszaka.",
    kategoria: "chlopcy",
    klucze: ["spodnie", "dres", "legginsy"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzy-dla-chlopca",
    h1: "Bluzy dla chłopca",
    tytul: "Bluzy dla chłopca 0–12 lat",
    opis: "Bluzy dla chłopca — miękkie, ciepłe i wygodne, zakładane przez głowę lub rozpinane. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Bluzy dla chłopca to podstawa garderoby na chłodniejsze dni. Wybieramy modele z miękkiej, przyjaznej skórze dzianiny — wygodne do zabawy i łatwe do łączenia ze spodniami czy dresami. Znajdziesz tu zarówno bluzy zakładane przez głowę, jak i rozpinane, w rozmiarach od niemowlęcych po szkolne.",
    kategoria: "chlopcy",
    klucze: ["bluza", "bluzka", "kaftanik"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-chlopca",
    h1: "Komplety dla chłopca",
    tytul: "Komplety dla chłopca 0–12 lat",
    opis: "Komplety dla chłopca — dresy i zestawy bluza + spodnie gotowe do noszenia. Miękkie tkaniny, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet dla chłopca to najwygodniejszy wybór — dostajesz gotowy zestaw i nie musisz nic dobierać. W tej kolekcji znajdziesz komplety dresowe i zestawy bluza + spodnie z miękkich, oddychających tkanin. Idealne na co dzień, do przedszkola i na spacer, w rozmiarach od 62 do 170.",
    kategoria: "chlopcy",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "koszulki-dla-chlopca",
    h1: "Koszulki i body dla chłopca",
    tytul: "Koszulki i body dla chłopca 0–12 lat",
    opis: "Koszulki i body dla chłopca — lekkie, bawełniane, na co dzień i pod bluzę. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Koszulki i body dla chłopca to baza garderoby na cały sezon. Lekka, bawełniana dzianina jest przyjemna w dotyku i przewiewna — świetnie sprawdza się solo w cieplejsze dni i jako warstwa pod bluzę. Proste, wygodne fasony w rozmiarach od 62 do 170.",
    kategoria: "chlopcy",
    klucze: ["koszul", "t-shirt", "tshirt", "body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Dziewczynki ──────────────────────────────────────────────────────────
  {
    slug: "spodnie-dla-dziewczynki",
    h1: "Spodnie i legginsy dla dziewczynki",
    tytul: "Spodnie i legginsy dla dziewczynki 0–12 lat",
    opis: "Spodnie i legginsy dla dziewczynki — prążkowane, dresowe i na co dzień. Miękka gumka, rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Spodnie i legginsy dla dziewczynki, które dają pełną swobodę ruchu podczas zabawy. Prążkowana dzianina i miękka gumka w pasie układają się na sylwetce i nie krępują ruchów. Świetnie łączą się z bluzami i tunikami — do przedszkola, szkoły i na spacer, w rozmiarach od 62 do 170.",
    kategoria: "dziewczynki",
    klucze: ["spodnie", "legginsy", "dres"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "sukienki-dla-dziewczynki",
    h1: "Sukienki dla dziewczynki",
    tytul: "Sukienki dla dziewczynki 0–12 lat",
    opis: "Sukienki dla dziewczynki — zwiewne, wygodne, na co dzień i na specjalne okazje. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Sukienki dla dziewczynki, w których wygoda idzie w parze z ładnym wyglądem. Zwiewne, przyjazne skórze materiały sprawdzają się i na co dzień, i na specjalne okazje. Dziewczęce fasony w rozmiarach od 62 do 170 — dla maluszka i starszej dziewczynki.",
    kategoria: "dziewczynki",
    klucze: ["sukienk", "tunika", "spodnic"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzy-dla-dziewczynki",
    h1: "Bluzy dla dziewczynki",
    tytul: "Bluzy dla dziewczynki 0–12 lat",
    opis: "Bluzy dla dziewczynki — miękkie i ciepłe, idealne na chłodniejsze dni. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Bluzy dla dziewczynki na chłodniejsze dni — miękkie, ciepłe i wygodne. Przyjazna skórze dzianina świetnie łączy się z legginsami, spodniami i sukienkami. Uniwersalne fasony do zabawy i na wyjście, w rozmiarach od 62 do 170.",
    kategoria: "dziewczynki",
    klucze: ["bluza", "bluzka", "kaftanik"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-dziewczynki",
    h1: "Komplety dla dziewczynki",
    tytul: "Komplety dla dziewczynki 0–12 lat",
    opis: "Komplety dla dziewczynki — gotowe zestawy z miękkich tkanin. Rozmiary 62–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet dla dziewczynki to gotowy, spójny zestaw — wygoda i ładny wygląd bez dobierania. Miękkie, oddychające tkaniny sprawdzają się na co dzień i na wyjście. Rozmiary od 62 do 170, dla maluszka i starszej dziewczynki.",
    kategoria: "dziewczynki",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Niemowlęta ───────────────────────────────────────────────────────────
  {
    slug: "body-niemowlece",
    h1: "Body niemowlęce",
    tytul: "Body niemowlęce — bawełniane 56–92",
    opis: "Body niemowlęce z miękkiej bawełny — zapinane na zatrzaski, łatwe przewijanie. Rozmiary 56–92. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Body niemowlęce to podstawa wyprawki. Wybieramy modele z miękkiej, oddychającej bawełny, delikatnej dla wrażliwej skóry noworodka. Zapięcia na zatrzaski ułatwiają przewijanie i przebieranie, także w nocy. Rozmiary od 56 do 92 — na pierwsze tygodnie i kolejne miesiące.",
    kategoria: "niemowleta",
    klucze: ["body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "pajacyki-i-spiochy-niemowlece",
    h1: "Pajacyki i śpiochy niemowlęce",
    tytul: "Pajacyki i śpiochy niemowlęce 56–92",
    opis: "Pajacyki i śpiochy niemowlęce — zapinane na zatrzaski, miękka bawełna, wygodne do spania i na co dzień. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Pajacyki i śpiochy niemowlęce zapewniają maluchowi komfort przez cały dzień i noc. Zapięcia na zatrzaski wzdłuż nogawek to błyskawiczne przewijanie, a miękka bawełna nie podrażnia delikatnej skóry. Jednoczęściowy fason nie podwija się — idealny do spania, na spacer i do domu.",
    kategoria: "niemowleta",
    klucze: ["pajac", "spioch", "polspioch"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-niemowlece",
    h1: "Komplety niemowlęce",
    tytul: "Komplety niemowlęce — dresy i zestawy 56–92",
    opis: "Komplety niemowlęce — gotowe zestawy bluza + spodnie z miękkiej bawełny. Łatwe zakładanie. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplet niemowlęcy to gotowy zestaw na co dzień — bez dobierania i kombinowania. Miękka bawełna jest przyjazna dla wrażliwej skóry, a wygodny krój ułatwia zakładanie i zdejmowanie. Idealny na spacer, do domu i jako element wyprawki, w rozmiarach 56–92.",
    kategoria: "niemowleta",
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "czapki-niemowlece",
    h1: "Czapki niemowlęce",
    tytul: "Czapki niemowlęce — bawełniane",
    opis: "Czapki niemowlęce z miękkich, przyjaznych skórze materiałów — chronią główkę malucha. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Czapki niemowlęce to drobny, ale niezbędny dodatek, który chroni główkę malucha przed chłodem i wiatrem. Miękkie, przyjazne skórze materiały są delikatne dla wrażliwej skóry noworodka. Dopełniają każdy zestaw i wyprawkę.",
    kategoria: "niemowleta",
    klucze: ["czapk", "opaska"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },

  // ── Frazy ogólne (wszystkie kategorie) ───────────────────────────────────
  {
    slug: "dresy-dzieciece",
    h1: "Dresy dziecięce",
    tytul: "Dresy dziecięce 0–12 lat",
    opis: "Dresy dziecięce — komplety i spodnie dresowe dla dziewczynek, chłopców i niemowląt. Miękkie i wytrzymałe. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Dresy dziecięce to najwygodniejszy wybór na co dzień — dla dziewczynek, chłopców i niemowląt. Miękkie, oddychające tkaniny i wytrzymałe wykończenie znoszą intensywną zabawę i częste pranie. Komplety i pojedyncze spodnie dresowe w rozmiarach od 56 do 170.",
    kategoria: null,
    klucze: ["dres"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dzieciece",
    h1: "Komplety dziecięce",
    tytul: "Komplety dziecięce 0–12 lat",
    opis: "Komplety dziecięce — gotowe zestawy dla dziewczynek, chłopców i niemowląt. Miękkie tkaniny, rozmiary 56–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Komplety dziecięce to gotowe zestawy, które oszczędzają czas — nie trzeba nic dobierać. Znajdziesz tu komplety dla dziewczynek, chłopców i niemowląt z miękkich, przyjaznych skórze tkanin. Idealne na co dzień, do żłobka, przedszkola i na wyjście.",
    kategoria: null,
    klucze: ["komplet"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "body-dzieciece",
    h1: "Body dziecięce",
    tytul: "Body dziecięce i niemowlęce",
    opis: "Body dziecięce — bawełniane, zapinane na zatrzaski, dla niemowląt i starszaków. Rozmiary 56–170. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Body dziecięce z miękkiej, oddychającej bawełny — przyjazne dla delikatnej skóry. Zapięcia na zatrzaski ułatwiają zakładanie i przewijanie. To baza garderoby zarówno dla niemowląt, jak i starszych dzieci, w rozmiarach od 56 do 170.",
    kategoria: null,
    klucze: ["body"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "czapki-dzieciece",
    h1: "Czapki dziecięce",
    tytul: "Czapki dziecięce 0–12 lat",
    opis: "Czapki dziecięce dla niemowląt i starszaków — miękkie i przyjazne skórze, chronią przed chłodem. Wysyłka InPost, 14 dni na zwrot.",
    wstep:
      "Czapki dziecięce chronią główkę przed chłodem i wiatrem — dla niemowląt i starszych dzieci. Miękkie, przyjazne skórze materiały są delikatne i wygodne. Dopełniają każdą stylizację i sprawdzają się przez cały sezon.",
    kategoria: null,
    klucze: ["czapk", "opaska"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  // ── Męskie ───────────────────────────────────────────────────────────────
  {
    slug: "swetry-meskie",
    h1: "Swetry męskie",
    tytul: "Swetry męskie — rozpinane, z półgolfem i dekoltem V",
    opis: "Swetry męskie: rozpinane na zamek, z półgolfem, z dekoltem V i okrągłym, cienkie i ocieplane polarem. Rozmiary od M do 7XL. Wysyłka w 1–2 dni, 14 dni na zwrot.",
    wstep:
      "Sweter męski na co dzień i do pracy — w tej kolekcji znajdziesz swetry rozpinane na zamek, modele z półgolfem na zamek lub guziki, klasyczne z dekoltem V i z okrągłym dekoltem. Są cienkie, lekkie swetry pod marynarkę oraz ciepłe, podszyte polarem lub futerkiem na zimę. Większość modeli ma szeroką rozmiarówkę — od M do 3XL, a wybrane także większe. Przy każdym rozmiarze podajemy wymiary w centymetrach, więc łatwo dobrać sweter bez przymierzania.",
    kategoria: "dorosli",
    klucze: ["sweter"],
    faq: [
      {
        q: "Jaki sweter męski wybrać na zimę?",
        a: "Na mrozy najlepiej sprawdza się sweter rozpinany z półgolfem, podszyty polarem lub futerkiem — grzeje jak lekka kurtka i łatwo go zdjąć w pomieszczeniu. Do biura i pod marynarkę wybierz cienki sweter z dekoltem V lub półgolfem.",
      },
      FAQ_ROZMIAR_MESKI,
      FAQ_DUZE_ROZMIARY,
      FAQ_DOSTAWA,
    ],
  },
  {
    slug: "bluzy-meskie",
    h1: "Bluzy męskie",
    tytul: "Bluzy męskie — z kapturem, rozpinane i bez kaptura",
    opis: "Bluzy męskie i młodzieżowe: z kapturem typu kangur, rozpinane na zamek oraz bez kaptura. Ciepłe i wygodne, rozmiary od M do 7XL. Wysyłka w 1–2 dni, 14 dni na zwrot.",
    wstep:
      "Bluza męska to najwygodniejsza warstwa na chłodniejsze dni. Mamy bluzy z kapturem i kieszenią kangurką, bluzy rozpinane na zamek oraz modele bez kaptura — także sportowe i w stylu college. Ciepłe, miękkie od środka dzianiny sprawdzają się na spacer, trening i do domu. Bluzy młodzieżowe i męskie dobierzesz po wymiarach w centymetrach podanych przy każdym rozmiarze.",
    kategoria: "dorosli",
    klucze: ["bluza"],
    faq: [FAQ_ROZMIAR_MESKI, FAQ_DUZE_ROZMIARY, FAQ_DOSTAWA],
  },
  {
    slug: "spodnie-dresowe-meskie",
    h1: "Spodnie dresowe męskie",
    tytul: "Spodnie dresowe męskie — cienkie i ocieplane",
    opis: "Spodnie dresowe męskie: cienkie na co dzień i ocieplane na zimę, także bojówki. Wygodna gumka w pasie, rozmiary od M do 7XL. Wysyłka w 1–2 dni, 14 dni na zwrot.",
    wstep:
      "Męskie spodnie dresowe do domu, na trening i na co dzień. W kolekcji są cienkie dresy na cieplejsze dni, spodnie ocieplane od środka na zimę oraz wygodne bojówki z kieszeniami. Wszystkie mają elastyczną gumkę w pasie i luźny, sportowy fason. Rozmiar dobierzesz po wymiarach w centymetrach podanych na karcie produktu.",
    kategoria: "dorosli",
    klucze: ["spodnie", "dres"],
    faq: [
      {
        q: "Czym różnią się spodnie dresowe cienkie od ocieplanych?",
        a: "Cienkie są z lżejszej dzianiny — dobre do domu, na trening i na cieplejsze miesiące. Ocieplane mają miękki meszek od środka i sprawdzają się jesienią i zimą, także na dwór.",
      },
      FAQ_ROZMIAR_MESKI,
      FAQ_DUZE_ROZMIARY,
      FAQ_DOSTAWA,
    ],
  },
  {
    slug: "odziez-meska-duze-rozmiary",
    h1: "Odzież męska — duże rozmiary",
    tytul: "Odzież męska duże rozmiary 3XL–7XL — swetry, bluzy, dresy",
    opis: "Odzież męska w dużych rozmiarach: swetry, bluzy i spodnie dresowe 3XL, 4XL, 5XL, 6XL i 7XL. Wymiary w centymetrach przy każdym rozmiarze. Wysyłka w 1–2 dni, 14 dni na zwrot.",
    wstep:
      "Duże rozmiary bez przepłacania. Zebraliśmy tu swetry, bluzy i spodnie dresowe dostępne w rozmiarach 3XL i większych — aż do 7XL. Fasony są luźne i wygodne, a dzianiny miękkie i rozciągliwe. Żeby nie zgadywać, przy każdym rozmiarze podajemy wymiary w centymetrach. Wystarczy zmierzyć ubranie, które dobrze leży, i porównać.",
    kategoria: "dorosli",
    klucze: ["duze rozmiary", "plus size", "3xl", "4xl", "5xl", "6xl", "7xl"], // do wyszukiwarki — produkty wybiera `dopasuj`
    dopasuj: (p) => (p.rozmiary ?? []).some((r) => DUZY_ROZMIAR.test(r)),
    faq: [
      {
        q: "Jakie duże rozmiary są dostępne?",
        a: "W tej kolekcji są produkty w rozmiarach 3XL, 4XL, 5XL, 6XL i 7XL — zależnie od modelu. Aktualnie dostępne rozmiary widać na karcie produktu.",
      },
      FAQ_ROZMIAR_MESKI,
      FAQ_DOSTAWA,
    ],
  },
];
