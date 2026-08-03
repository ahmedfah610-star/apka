// Artykuły bloga — poradniki dla rodziców (ruch organiczny z Google).
// Treść możesz swobodnie edytować i dopisywać kolejne wpisy.

export type Blok =
  | { typ: "p"; tekst: string }
  | { typ: "h2"; tekst: string }
  | { typ: "ul"; punkty: string[] };

export interface Artykul {
  slug: string;
  tytul: string;
  opis: string;
  data: string; // ISO
  czasCzytania: number; // minuty
  kategoria: string;
  hue: number;
  tresc: Blok[];
}

export const ARTYKULY: Artykul[] = [
  {
    slug: "jak-dobrac-rozmiar-ubranka-dla-dziecka",
    tytul: "Jak dobrać rozmiar ubranka dla dziecka?",
    opis: "Rozmiary ubranek dziecięcych odpowiadają wzrostowi w centymetrach. Podpowiadamy, jak wybrać właściwy rozmiar i uniknąć zwrotów.",
    data: "2026-08-01",
    czasCzytania: 4,
    kategoria: "Poradnik",
    hue: 340,
    tresc: [
      { typ: "p", tekst: "Rozmiary ubranek dziecięcych w Polsce i Europie oznacza się liczbą odpowiadającą wzrostowi dziecka w centymetrach. Rozmiar 92 oznacza więc ubranko dla dziecka o wzroście około 92 cm, a nie „na 2 lata”. Dzięki temu dobór jest prosty — wystarczy zmierzyć dziecko." },
      { typ: "h2", tekst: "Zmierz dziecko, nie zgaduj po wieku" },
      { typ: "p", tekst: "Dzieci w tym samym wieku bywają bardzo różne. Zamiast kierować się metryką, zmierz aktualny wzrost dziecka (od czubka głowy do pięt) i dobierz rozmiar najbliższy tej wartości." },
      { typ: "h2", tekst: "Rozmiar a wiek — orientacyjnie" },
      { typ: "ul", punkty: [
        "56–68 — noworodek i pierwsze miesiące",
        "74–86 — ok. 6–18 miesięcy",
        "92–104 — ok. 2–4 lata",
        "110–128 — ok. 5–8 lat",
        "134–164 — ok. 9–14 lat",
      ] },
      { typ: "h2", tekst: "Gdy dziecko jest „pomiędzy”" },
      { typ: "p", tekst: "Jeśli wzrost wypada pomiędzy dwoma rozmiarami, wybierz większy — ubranko posłuży dłużej, a dzieci szybko rosną. Przy dresach i piżamach lekki zapas jest wręcz wskazany." },
      { typ: "p", tekst: "Na karcie każdego produktu w naszym sklepie znajdziesz tabelę rozmiarów z przelicznikiem rozmiar–wiek–wzrost. Warto z niej skorzystać przed zakupem." },
    ],
  },
  {
    slug: "wyprawka-dla-noworodka-lista-ubranek",
    tytul: "Wyprawka dla noworodka — lista niezbędnych ubranek",
    opis: "Co spakować do szpitala i przygotować na powrót do domu? Praktyczna lista ubranek dla noworodka bez zbędnych rzeczy.",
    data: "2026-07-25",
    czasCzytania: 5,
    kategoria: "Wyprawka",
    hue: 160,
    tresc: [
      { typ: "p", tekst: "Wyprawka dla noworodka nie musi być ogromna. Maluch szybko rośnie, więc zamiast kupować wszystko w rozmiarze 56, część rzeczy warto wziąć od razu w 62. Oto zestaw, który naprawdę się przydaje." },
      { typ: "h2", tekst: "Ubranka na start (rozmiar 56–62)" },
      { typ: "ul", punkty: [
        "body z długim rękawem — 5–7 szt.",
        "pajacyki / śpiochy zapinane na zatrzaski — 4–6 szt.",
        "półśpiochy i spodenki — 3–4 szt.",
        "kaftaniki lub bluzy — 2–3 szt.",
        "czapeczki bawełniane — 2 szt.",
        "skarpetki / buciki niemowlęce — 3–4 pary",
      ] },
      { typ: "h2", tekst: "Na co zwrócić uwagę" },
      { typ: "ul", punkty: [
        "zapięcia na zatrzaski z przodu — łatwe przewijanie,",
        "miękka, przewiewna bawełna,",
        "brak uciskających gumek i metek przy skórze,",
        "łatwe pranie w 30–40°C.",
      ] },
      { typ: "p", tekst: "Nie kupuj zbyt wiele w najmniejszym rozmiarze — noworodki rosną z tygodnia na tydzień. Lepiej dokupić w razie potrzeby niż zostać z nieużywanymi ubrankami." },
    ],
  },
  {
    slug: "jak-ubierac-niemowle-warstwy-pory-roku",
    tytul: "Jak ubierać niemowlę? Warstwy i pory roku",
    opis: "Zasada warstw, reguła „jedna warstwa więcej niż dorosły” i praktyczne wskazówki, jak ubrać niemowlę latem i zimą.",
    data: "2026-07-15",
    czasCzytania: 4,
    kategoria: "Poradnik",
    hue: 230,
    tresc: [
      { typ: "p", tekst: "Niemowlęta gorzej regulują temperaturę ciała niż dorośli, dlatego kluczem jest ubieranie „na cebulkę” — w kilka cienkich warstw, które łatwo zdjąć lub dołożyć." },
      { typ: "h2", tekst: "Reguła jednej warstwy" },
      { typ: "p", tekst: "Popularna zasada mówi: ubierz niemowlę w tyle warstw, ile masz na sobie, plus jedna. Sprawdzaj kark dziecka — powinien być ciepły i suchy. Spocone plecy oznaczają przegrzanie, chłodne rączki to norma." },
      { typ: "h2", tekst: "Lato" },
      { typ: "ul", punkty: [
        "przewiewna bawełna, jasne kolory,",
        "cienkie body z krótkim rękawem + luźne spodenki,",
        "czapeczka z daszkiem na słońce,",
        "unikaj bezpośredniego słońca w godzinach 11–15.",
      ] },
      { typ: "h2", tekst: "Zima" },
      { typ: "ul", punkty: [
        "warstwa bazowa: body z długim rękawem,",
        "warstwa środkowa: dres lub komplet dzianinowy,",
        "warstwa wierzchnia: kombinezon lub kurtka,",
        "czapka, skarpetki i rękawiczki — w wózku dokładaj kocyk zamiast grubej kurtki.",
      ] },
    ],
  },
  {
    slug: "ubranka-do-zlobka-i-przedszkola",
    tytul: "Ubranka do żłobka i przedszkola — co się sprawdza",
    opis: "Wygodne, samodzielne, wytrzymałe. Podpowiadamy, jakie ubranka ułatwią dziecku dzień w żłobku i przedszkolu.",
    data: "2026-07-05",
    czasCzytania: 4,
    kategoria: "Poradnik",
    hue: 40,
    tresc: [
      { typ: "p", tekst: "W żłobku i przedszkolu liczy się wygoda i samodzielność. Ubranko powinno być łatwe do zdjęcia i założenia przez samo dziecko oraz odporne na zabawę, jedzenie i pranie." },
      { typ: "h2", tekst: "Sprawdzą się" },
      { typ: "ul", punkty: [
        "dresy i legginsy z miękką gumką w pasie (bez guzików),",
        "bluzy zakładane przez głowę zamiast zapinanych,",
        "koszulki i body łatwe do samodzielnego założenia,",
        "ubrania na zmianę — komplet zapasowy w plecaku.",
      ] },
      { typ: "h2", tekst: "Czego unikać" },
      { typ: "ul", punkty: [
        "kombinezonów i body z wieloma guzikami,",
        "sztywnych jeansów i pasków,",
        "ubrań „tylko do ręcznego prania”.",
      ] },
      { typ: "p", tekst: "Warto podpisać metki ubranek imieniem dziecka — w grupie łatwo o pomyłki. Postaw na proste, wytrzymałe rzeczy, których nie żal pobrudzić." },
    ],
  },
  {
    slug: "jak-prac-i-dbac-o-ubranka-dzieciece",
    tytul: "Jak prać i dbać o ubranka dziecięce",
    opis: "Temperatura prania, bezpieczne środki i triki na trwałość ubranek dziecięcych oraz delikatną skórę malucha.",
    data: "2026-06-28",
    czasCzytania: 3,
    kategoria: "Pielęgnacja",
    hue: 300,
    tresc: [
      { typ: "p", tekst: "Skóra dzieci jest delikatna, dlatego pranie ubranek warto potraktować trochę inaczej niż dorosłych. Kilka prostych zasad wystarczy, by ubranka służyły dłużej i były bezpieczne." },
      { typ: "h2", tekst: "Zanim założysz pierwszy raz" },
      { typ: "p", tekst: "Nowe ubranka wypierz przed pierwszym użyciem — usuwa to pozostałości z produkcji i transportu." },
      { typ: "h2", tekst: "Zasady prania" },
      { typ: "ul", punkty: [
        "temperatura 30–40°C dla większości ubranek (sprawdź metkę),",
        "delikatny proszek lub płyn dla dzieci, bez wybielaczy i mocnych zapachów,",
        "unikaj płynów zmiękczających u niemowląt — mogą uczulać,",
        "wywróć ubranka z nadrukiem na lewą stronę.",
      ] },
      { typ: "h2", tekst: "Trwałość" },
      { typ: "p", tekst: "Suszenie w cieniu i pranie w niższej temperaturze wydłużają życie tkanin i chronią kolory oraz nadruki. Bawełniane ubranka mogą lekko się skurczyć przy pierwszym praniu — to normalne." },
    ],
  },
];

export function znajdzArtykul(slug: string): Artykul | undefined {
  return ARTYKULY.find((a) => a.slug === slug);
}
