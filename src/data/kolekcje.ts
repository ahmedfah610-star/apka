import type { Kategoria, Produkt } from "@/data/produkty";
import { czyCieply, SLUG_PREZENTY, SLUG_ZIMA } from "@/lib/sezon";

// Strony docelowe (landing pages) pod frazy sprzedażowe. Każda ma własny URL,
// tytuł, nagłówek H1, opis SEO, treść i FAQ (rich results) oraz listę produktów
// dopasowaną po nazwie/kategorii. Cel: wysokie pozycje na konkretne zapytania.

export interface Kolekcja {
  slug: string;
  h1: string;
  tytul: string; // meta title (bez sufiksu marki — dokłada go szablon)
  opis: string; // meta description
  krotko: string; // 1 zdanie nad produktami — co klient tu znajdzie (pełny wstęp jest pod listą)
  wstep: string; // dłuższy tekst (SEO) — pod listą produktów, w sekcji „O kolekcji”
  kategoria: Kategoria | null;
  klucze: string[]; // dopasowanie po nazwie produktu (znormalizowane, małe litery)
  wyklucz?: string[]; // słowa w nazwie, które wykluczają produkt (np. „komplet" w bluzach)
  dopasuj?: (p: Produkt) => boolean; // własna reguła zamiast kluczy (np. ciepłe ubranka na zimę)
  priorytet?: (p: Produkt) => number; // kolejność na stronie: wyższy wynik wyżej (przy równym — kolejność katalogu)
  grupa?: "prezenty"; // kolekcje z tej samej grupy linkują się nawzajem w „Zobacz też” w pierwszej kolejności
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
  const lista = produkty.filter((p) => {
    if (kol.kategoria && p.kategoria !== kol.kategoria) return false;
    if (kol.dopasuj) return kol.dopasuj(p);
    // Kolekcje „dziecięce" bez działu (dresy, komplety, body, czapki) — bez odzieży męskiej.
    if (!kol.kategoria && p.kategoria === "dorosli") return false;
    const n = norm(p.nazwa);
    if (kol.wyklucz?.some((w) => n.includes(w))) return false;
    return kol.klucze.some((k) => n.includes(k));
  });
  if (!kol.priorytet) return lista;
  // Ten sam model w kilku kolorach nie zajmuje całej góry strony: każde kolejne powtórzenie
  // (ten sam rodzaj i napis) traci 3,5 pkt, więc na górze miesza się kilka różnych rzeczy.
  const powtorzenia = new Map<string, number>();
  const wynik = new Map(
    lista.map((p) => {
      // Model = rodzaj ubranka (pierwsze słowo) + napis, a bez napisu — początek nazwy.
      const n = norm(p.nazwa).replace(/[^a-z ]/g, "");
      const klucz = `${n.split(" ")[0]}|${NAPISY.find((k) => n.includes(k)) ?? n.slice(0, 28)}`;
      const ile = powtorzenia.get(klucz) ?? 0;
      powtorzenia.set(klucz, ile + 1);
      return [p.id, kol.priorytet!(p) - 3.5 * ile];
    }),
  );
  return [...lista].sort((a, b) => wynik.get(b.id)! - wynik.get(a.id)!); // sort stabilny — remisy w kolejności katalogu
}

// ── Prezenty ─────────────────────────────────────────────────────────────
// Słowa (po normalizacji) w nazwach ubranek z napisem dla babci, dziadka, taty.
const NAPISY = ["babci", "dziadk", "dziadek", "tatus", "prezes", "kocham"];
const maNapis = (p: Produkt) => NAPISY.some((k) => norm(p.nazwa).includes(k));
const ma = (p: Produkt, ...slowa: string[]) => slowa.some((k) => norm(p.nazwa).includes(k));
const dostepny = (p: Produkt) => p.stan !== 0;
const dzieciecy = (p: Produkt) => p.kategoria !== "dorosli";
/** Zestawy w pudełku / wieloczęściowe — najbardziej „prezentowe”. */
const zestawPrezentowy = (p: Produkt) => ma(p, "wyprawka komplet", "komplet wyprawka", "czesci", "chrzt");

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
const FAQ_DOSTAWA_PREZENT = {
  q: "Do kiedy zamówić, żeby prezent dotarł na czas?",
  a: "Wysyłamy w 1–2 dni robocze, a przewoźnik doręcza zwykle w 1–2 dni. Na Mikołajki czy Święta zamów z kilkudniowym zapasem — w grudniu kurierzy mają więcej pracy. Na zwrot masz 14 dni.",
};
const FAQ_ROZMIAR_PREZENT = {
  q: "Jaki rozmiar wybrać na prezent?",
  a: "Rozmiar to wzrost dziecka w centymetrach (np. 68 = ok. 68 cm, czyli zwykle 3–6 miesięcy). Na prezent wybierz rozmiar o jeden większy niż obecny — dziecko szybko rośnie i ubranko posłuży dłużej. Wymiary każdego rozmiaru podajemy na karcie produktu.",
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
    opis: "Ciepłe ubranka na zimę dla dzieci: sweterki, ocieplane spodnie, welurowe komplety i czapki. Wysyłka w 1–2 dni — ubierz malucha na mrozy!",
    krotko: "Sweterki, ocieplane spodnie, welurowe komplety i czapki — wszystko, żeby maluchowi było ciepło na spacerze.",
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
  // ── Prezenty (sezonowo w menu: od 15 listopada do Wigilii — lib/sezon) ─────
  {
    slug: SLUG_PREZENTY,
    h1: "Prezent dla dziecka na Mikołajki i Święta — do 30 zł",
    tytul: "Prezent dla dziecka na Mikołajki i Święta do 30 zł",
    opis: "Prezenty dla dzieci do 30 zł: body z napisem dla babci i dziadka, ciepłe czapki, sweterki i komplety. Wysyłka w 1–2 dni robocze. Wybierz prezent na Mikołajki i pod choinkę!",
    krotko: "Ubranka do 30 zł, które ucieszą i rodziców, i malucha: zabawne body z napisem, ciepłe czapki, sweterki i komplety.",
    wstep:
      "Szukasz prezentu dla dziecka na Mikołajki albo pod choinkę, który nie wyląduje na dnie szafy? Ubranko to prezent praktyczny — rodzice zawsze go docenią, bo maluchy rosną błyskawicznie. Zebraliśmy tu rzeczy do 30 zł: body z napisami dla babci, dziadka i taty, ciepłe czapki, sweterki i kamizelki na zimę oraz wygodne komplety. Na górze listy są nasze typy na prezent. Przy każdym rozmiarze podajemy wymiary w centymetrach, a paczki wysyłamy w 1–2 dni robocze.",
    kategoria: null,
    grupa: "prezenty",
    klucze: ["prezent", "mikolaj", "swieta"], // tylko do wyszukiwarki — produkty wybiera `dopasuj`
    dopasuj: (p) =>
      dzieciecy(p) && dostepny(p) && p.cena <= 30 && (maNapis(p) || czyCieply(p) || ma(p, "komplet", "pajac", "body", "sukienk", "wyprawk")),
    priorytet: (p) => (maNapis(p) ? 3 : 0) + (ma(p, "czapk", "sweter", "kamizelk") ? 2 : 0) + (zestawPrezentowy(p) ? 1 : 0),
    faq: [
      {
        q: "Jakie ubranko kupić dziecku na Mikołajki?",
        a: "Sprawdzają się rzeczy, które od razu się przydadzą: ciepła czapka, sweterek albo kamizelka na zimę, wygodny komplet do domu. Jeśli prezent jest od babci lub dziadka, hitem są body z napisem, np. „Babcia tu była” albo „Mój dziadek jest najlepszy”.",
      },
      FAQ_ROZMIAR_PREZENT,
      FAQ_DOSTAWA_PREZENT,
    ],
  },
  {
    slug: "ubranka-z-napisem-dla-wnuka",
    h1: "Ubranka z napisem — prezent dla wnuka i wnuczki",
    tytul: "Body z napisem babcia i dziadek — prezent dla wnuka",
    opis: "Body i pajacyki z napisem „Babcia tu była”, „Mój dziadek jest najlepszy”, „Kocham babcię i dziadka”. Bawełna, rozmiary dla niemowląt, wysyłka w 1–2 dni robocze. Prezent od babci i dziadka!",
    krotko: "„Babcia tu była”, „Mój dziadek jest najlepszy”, „Kocham babcię i dziadka” — body i pajacyki, które robią furorę na rodzinnych zdjęciach.",
    wstep:
      "Ubranka z napisem to ulubiony prezent babć i dziadków dla wnuków. Body „Babcia tu była” z odciskami buziaków, „Mój dziadek jest najlepszy”, „Tata wie dużo, ale dziadek wie więcej” czy „Kocham babcię i dziadka” wywołują uśmiech przy każdym przewijaniu i świetnie wyglądają na zdjęciach. To praktyczny prezent na narodziny, chrzest, Mikołajki, Święta i Dzień Babci i Dziadka. Wybierz rozmiar o jeden większy niż obecny — posłuży dłużej.",
    kategoria: null,
    grupa: "prezenty",
    klucze: NAPISY,
    dopasuj: (p) => dzieciecy(p) && dostepny(p) && maNapis(p),
    priorytet: (p) => (ma(p, "babci") ? 2 : 0) + (ma(p, "dziadk", "dziadek") ? 1 : 0),
    faq: [
      {
        q: "Jaki napis wybrać na prezent od babci lub dziadka?",
        a: "Od babci najczęściej wybierane jest body „Babcia tu była”, od dziadka — „Mój dziadek jest najlepszy” albo „Tata wie dużo, ale dziadek wie więcej”. Na prezent od obojga sprawdzi się „Kocham babcię i dziadka”.",
      },
      FAQ_ROZMIAR_PREZENT,
      FAQ_DOSTAWA_PREZENT,
    ],
  },
  {
    slug: "prezent-dla-niemowlaka",
    h1: "Prezent dla niemowlaka",
    tytul: "Prezent dla niemowlaka — wyprawki, komplety, body z napisem",
    opis: "Prezent dla niemowlaka: wyprawki dla noworodka, eleganckie komplety, ubranka do chrztu i body z napisem. Miękka bawełna, wysyłka w 1–2 dni robocze. Wybierz prezent na narodziny i chrzest!",
    krotko: "Wyprawki dla noworodka, eleganckie komplety i body z napisem — prezent na narodziny, chrzest i pierwsze Święta.",
    wstep:
      "Prezent dla niemowlaka powinien być przede wszystkim praktyczny i miły w dotyku. Na górze tej strony znajdziesz kilkuczęściowe wyprawki dla noworodka i ubranka do chrztu, dalej eleganckie pajacyki, komplety i body z napisami dla rodziny. Ubranka uszyte są z miękkich materiałów przyjaznych delikatnej skórze, z zapięciami ułatwiającymi przewijanie. Jeśli nie znasz rozmiaru, wybierz 62 lub 68 — maluch szybko do nich dorośnie.",
    kategoria: "niemowleta",
    grupa: "prezenty",
    klucze: ["wyprawk", "chrzt", "elegancki"],
    dopasuj: (p) => dostepny(p) && (ma(p, "wyprawk", "chrzt", "elegancki", "komplet") || maNapis(p)),
    priorytet: (p) => (zestawPrezentowy(p) ? 3 : 0) + (ma(p, "elegancki") ? 2 : 0) + (maNapis(p) ? 2 : 0),
    faq: [
      {
        q: "Co kupić na prezent dla noworodka?",
        a: "Najbezpieczniej kilkuczęściowy zestaw (wyprawkę) albo komplet w rozmiarze 62–68. Rodzice zawsze potrzebują ubranek na zmianę, a większy rozmiar posłuży, gdy maluch podrośnie. Na chrzest sprawdzą się eleganckie komplety i ubranka wizytowe.",
      },
      FAQ_ROZMIAR_PREZENT,
      FAQ_DOSTAWA_PREZENT,
    ],
  },
  {
    slug: "ubranka-do-chrztu",
    h1: "Ubranka do chrztu",
    tytul: "Ubranka do chrztu dla chłopca i dziewczynki",
    opis: "Ubranka do chrztu dla chłopca i dziewczynki: wizytowe komplety w bieli i ecru, także na prezent. Wymiary w cm, wysyłka w 1–2 dni robocze. Sprawdź!",
    krotko: "Wizytowe komplety do chrztu dla chłopca i dziewczynki — w bieli i ecru, gotowe na ten wyjątkowy dzień.",
    wstep:
      "Ubranko do chrztu to strój na jeden z najważniejszych dni w życiu malucha i pamiątka na lata. Wybraliśmy wizytowe komplety dla chłopców i dziewczynek w jasnych kolorach, które pięknie wyglądają na zdjęciach. Dobrze sprawdzają się także jako prezent od chrzestnych. Przy wyborze rozmiaru kieruj się wzrostem dziecka w dniu uroczystości, a w razie wątpliwości weź rozmiar większy.",
    kategoria: null,
    grupa: "prezenty",
    klucze: ["chrzt", "chrzest"],
    dopasuj: (p) => dzieciecy(p) && ma(p, "chrzt", "chrzest"),
    priorytet: (p) => (dostepny(p) ? 1 : 0),
    faq: [
      {
        q: "Jaki rozmiar ubranka do chrztu wybrać?",
        a: "Zmierz wzrost dziecka i dodaj kilka centymetrów zapasu na dzień uroczystości — rozmiar to wzrost w centymetrach. Jeśli chrzest jest za kilka tygodni, wybierz rozmiar większy.",
      },
      FAQ_DOSTAWA_PREZENT,
    ],
  },
  // ── Chłopcy ──────────────────────────────────────────────────────────────
  {
    slug: "spodnie-dla-chlopca",
    h1: "Spodnie dla chłopca",
    tytul: "Spodnie dla chłopca 0–12 lat",
    opis: "Spodnie dla chłopca — dresowe, sportowe i na co dzień. Wygodna gumka w pasie, miękkie tkaniny, rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Dresowe, sportowe i na co dzień — wygodna gumka w pasie i miękkie tkaniny na każdą zabawę.",
    wstep:
      "Szukasz spodni dla chłopca, które wytrzymają bieganie, plac zabaw i częste pranie? W tej kolekcji znajdziesz spodnie dresowe i sportowe z miękką gumką w pasie, która nie uciska brzuszka. Wygodne fasony sprawdzają się do przedszkola, szkoły i na wyjście — a rozmiary od 62 do 170 pozwalają dobrać je dla malucha i starszaka.",
    kategoria: "chlopcy",
    klucze: ["spodnie", "dres", "legginsy"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzy-dla-chlopca",
    h1: "Bluzy i bluzki dla chłopca",
    tytul: "Bluzy i bluzki dla chłopca 0–12 lat",
    opis: "Bluzy i bluzki dla chłopca — miękkie, wygodne, zakładane przez głowę lub rozpinane. Rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Bluzy z kapturem, rozpinane i bluzki z długim rękawem — miękkie, ciepłe, łatwe do łączenia.",
    wstep:
      "Bluzy i bluzki dla chłopca to podstawa garderoby na chłodniejsze dni. Wybieramy modele z miękkiej, przyjaznej skórze dzianiny — wygodne do zabawy i łatwe do łączenia ze spodniami czy dresami. Komplety bluza + spodnie znajdziesz w osobnej kolekcji kompletów.",
    kategoria: "chlopcy",
    klucze: ["bluza", "bluzk", "bluzecz", "kaftanik"],
    wyklucz: ["komplet", "spodnie"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-chlopca",
    h1: "Komplety dla chłopca",
    tytul: "Komplety dla chłopca 0–12 lat",
    opis: "Komplety dla chłopca — dresy i zestawy bluza + spodnie gotowe do noszenia. Miękkie tkaniny, rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Gotowe zestawy bluza + spodnie — ubierasz dziecko w minutę, a wygląda świetnie.",
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
    opis: "Koszulki i body dla chłopca — lekkie, bawełniane, na co dzień i pod bluzę. Rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Lekkie, bawełniane koszulki i body — solo w cieplejsze dni i pod bluzę zimą.",
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
    opis: "Spodnie i legginsy dla dziewczynki — prążkowane, dresowe i na co dzień. Miękka gumka, rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Prążkowane legginsy i spodnie dresowe — dają swobodę ruchu i pasują do każdej bluzki.",
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
    opis: "Sukienki dla dziewczynki — zwiewne, wygodne, na co dzień i na specjalne okazje. Rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Zwiewne i wygodne sukienki — na co dzień, do przedszkola i na wyjątkowe okazje.",
    wstep:
      "Sukienki dla dziewczynki, w których wygoda idzie w parze z ładnym wyglądem. Zwiewne, przyjazne skórze materiały sprawdzają się i na co dzień, i na specjalne okazje. Dziewczęce fasony w rozmiarach od 62 do 170 — dla maluszka i starszej dziewczynki.",
    kategoria: "dziewczynki",
    klucze: ["sukienk", "tunika", "spodnic"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "bluzki-dla-dziewczynki",
    h1: "Bluzki dla dziewczynki",
    tytul: "Bluzki dla dziewczynki 0–12 lat",
    opis: "Bluzki dla dziewczynki — z krótkim i długim rękawem, bawełniane, z kokardkami i nadrukami. Rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Bluzki z krótkim i długim rękawem — kokardki, falbanki i wesołe nadruki z miękkiej bawełny.",
    wstep:
      "Bluzki dla dziewczynki na co dzień i na wyjście — z krótkim i długim rękawem, z miękkiej, przyjaznej skórze bawełny. Kokardki, falbanki i wesołe nadruki świetnie łączą się z legginsami, spódniczkami i spodniami. Rozmiary od 62 do 170.",
    kategoria: "dziewczynki",
    klucze: ["bluzk", "bluzecz", "bluza", "kaftanik"],
    wyklucz: ["komplet", "spodnie"],
    faq: [FAQ_ROZMIAR, FAQ_DOSTAWA],
  },
  {
    slug: "komplety-dla-dziewczynki",
    h1: "Komplety dla dziewczynki",
    tytul: "Komplety dla dziewczynki 0–12 lat",
    opis: "Komplety dla dziewczynki — gotowe zestawy z miękkich tkanin. Rozmiary 62–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Gotowe, dopasowane zestawy — ładny strój bez kombinowania, co do czego pasuje.",
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
    opis: "Body niemowlęce z miękkiej bawełny na zatrzaski — szybkie przewijanie bez marudzenia. Rozmiary 56–92, wysyłka w 1–2 dni. Dobierz na zapas!",
    krotko: "Bawełniane body na zatrzaski — szybkie przewijanie i zero podrażnień. Warto mieć kilka na zmianę.",
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
    opis: "Pajacyki i śpiochy niemowlęce — zapinane na zatrzaski, miękka bawełna, wygodne do spania i na co dzień. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Miękkie pajacyki i śpiochy na zatrzaski — wygodne do spania i na cały dzień.",
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
    opis: "Komplety niemowlęce bluza + spodnie z miękkiej bawełny — gotowy strój w jednym kliknięciu. Wymiary w cm, wysyłka w 1–2 dni. Wybierz zestaw!",
    krotko: "Zestawy bluza + spodnie z miękkiej bawełny — gotowy strój dla maluszka w jednym kliknięciu.",
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
    opis: "Czapki niemowlęce z miękkich, przyjaznych skórze materiałów — chronią główkę malucha. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Miękkie czapeczki, które chronią główkę malucha przed chłodem i wiatrem.",
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
    opis: "Dresy dziecięce na co dzień i do przedszkola — miękkie, wytrzymałe, w wesołe wzory. Rozmiary 62–170, wysyłka w 1–2 dni. Sprawdź komplety!",
    krotko: "Wygodne dresy na przedszkole, plac zabaw i do domu — miękkie, wytrzymałe, w wesołe wzory.",
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
    opis: "Komplety dziecięce — gotowe zestawy dla dziewczynek, chłopców i niemowląt. Miękkie tkaniny, rozmiary 56–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Gotowe zestawy dla dziewczynek, chłopców i niemowląt — ubranie w minutę, bez dobierania.",
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
    opis: "Body dziecięce — bawełniane, zapinane na zatrzaski, dla niemowląt i starszaków. Rozmiary 56–170. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Bawełniane body na zatrzaski dla niemowląt i starszaków — baza codziennej garderoby.",
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
    opis: "Czapki dziecięce dla niemowląt i starszaków — miękkie i przyjazne skórze, chronią przed chłodem. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Ciepłe, miękkie czapki dla niemowląt i starszaków — na zimne poranki i wietrzne spacery.",
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
    opis: "Swetry męskie rozpinane, z półgolfem i ocieplane — od M do 7XL, wymiary w cm przy każdym rozmiarze. Wysyłka w 1–2 dni. Zamów ciepły sweter!",
    krotko: "Swetry rozpinane, z półgolfem i ocieplane — od M do 7XL, z wymiarami przy każdym rozmiarze.",
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
    opis: "Bluzy męskie z kapturem i rozpinane — ciepłe, wygodne, od M do 7XL. Wymiary w cm przy każdym rozmiarze, wysyłka w 1–2 dni. Wybierz swoją!",
    krotko: "Bluzy z kapturem i rozpinane — ciepłe, wygodne, od M do 7XL.",
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
    opis: "Męskie spodnie dresowe cienkie i ocieplane, także bojówki — od M do 7XL, wymiary w cm. Wysyłka w 1–2 dni, 14 dni na zwrot. Sprawdź!",
    krotko: "Cienkie i ocieplane spodnie dresowe, także bojówki — wygodna gumka i rozmiary do 7XL.",
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
    opis: "Duże rozmiary męskie 3XL–7XL: swetry, bluzy i dresy z wymiarami w cm — bez zgadywania rozmiaru. Wysyłka w 1–2 dni. Znajdź swój rozmiar!",
    krotko: "Swetry, bluzy i dresy w rozmiarach 3XL–7XL — z wymiarami w cm, bez zgadywania rozmiaru.",
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
