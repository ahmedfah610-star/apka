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
  zdjecie?: string; // okładka (public/img/blog/<slug>.jpg)
  tresc: Blok[];
}

export const ARTYKULY: Artykul[] = [
  {
    slug: "jak-dobrac-rozmiar-ubranka-dla-dziecka",
    tytul: "Jak dobrać rozmiar ubranka dla dziecka?",
    opis: "Rozmiary ubranek dziecięcych odpowiadają wzrostowi w centymetrach. Podpowiadamy krok po kroku, jak zmierzyć dziecko, odczytać tabelę rozmiarów i uniknąć zwrotów.",
    data: "2026-08-01",
    czasCzytania: 6,
    kategoria: "Poradnik",
    hue: 340,
    zdjecie: "/img/blog/jak-dobrac-rozmiar-ubranka-dla-dziecka.jpg",
    tresc: [
      { typ: "p", tekst: "Zakupy ubranek przez internet bywają stresujące — bez przymierzalni łatwo trafić o rozmiar za mały lub za duży. Na szczęście w Polsce i całej Europie obowiązuje jeden, prosty system: rozmiar ubranka to po prostu wzrost dziecka w centymetrach. Rozmiar 92 oznacza ubranko dla dziecka o wzroście około 92 cm — a nie „na 2 lata”. Gdy raz to zrozumiesz, dobór rozmiaru przestaje być loterią." },
      { typ: "h2", tekst: "Zmierz dziecko, nie zgaduj po wieku" },
      { typ: "p", tekst: "To najważniejsza zasada tego poradnika. Dzieci w tym samym wieku potrafią różnić się wzrostem nawet o kilkanaście centymetrów, dlatego metryka jest zawodnym drogowskazem. Zamiast niej użyj miarki krawieckiej." },
      { typ: "ul", punkty: [
        "Zmierz wzrost od czubka głowy do pięt — najlepiej, gdy dziecko stoi przy ścianie bez butów.",
        "Młodsze niemowlę zmierzysz na leżąco: zaznacz miejsce przy główce i przy stópkach, a potem zmierz odcinek.",
        "Zapisz też obwód klatki piersiowej i pasa — przydają się przy kurtkach, spodniach i body.",
        "Powtarzaj pomiar co 2–3 miesiące u maluchów; dzieci rosną skokowo.",
      ] },
      { typ: "p", tekst: "Mając aktualny wzrost, wybierasz rozmiar najbliższy tej wartości. To wszystko — reszta to już tylko drobne korekty." },
      { typ: "h2", tekst: "Rozmiar a wiek — tabela orientacyjna" },
      { typ: "p", tekst: "Poniższe przedziały traktuj jako punkt wyjścia, a nie sztywną regułę. Jeśli Twoje dziecko jest wyższe lub niższe od rówieśników, kieruj się wzrostem." },
      { typ: "ul", punkty: [
        "50–56 — noworodek (pierwsze dni i tygodnie)",
        "62–68 — ok. 3–6 miesięcy",
        "74–86 — ok. 9–18 miesięcy",
        "92–104 — ok. 2–4 lata",
        "110–128 — ok. 5–8 lat",
        "134–164 — ok. 9–14 lat",
      ] },
      { typ: "h2", tekst: "Gdy dziecko jest „pomiędzy” rozmiarami" },
      { typ: "p", tekst: "Wzrost 89 cm — brać 86 czy 92? W takiej sytuacji niemal zawsze wybieraj większy rozmiar. Ubranko posłuży dłużej, a dzieci rosną szybciej, niż zdążą je znosić. Przy dresach, piżamach i rzeczach zakładanych „na luzie” lekki zapas jest wręcz wskazany — zwłaszcza jeśli spodnie mają regulowaną gumkę w pasie." },
      { typ: "p", tekst: "Wyjątkiem bywają rzeczy, które muszą dobrze leżeć: body niemowlęce (zbyt duże podwija się pod pieluchą), rajstopy oraz kurtki zimowe, w których za duży rozmiar przepuszcza chłód. Tu celuj w rozmiar dokładnie na wzrost." },
      { typ: "h2", tekst: "Materiał i krój też mają znaczenie" },
      { typ: "p", tekst: "Dzianina i bawełna z domieszką elastanu wybaczają drobne różnice — rozciągają się i układają na sylwetce. Sztywniejsze tkaniny (jeans, len, tkane koszule) są mniej wyrozumiałe, więc przy nich warto trzymać się tabeli ściślej. Zwróć też uwagę na to, czy producent szyje „na styk”, czy z zapasem — pomaga w tym sekcja opinii i zdjęcia od innych kupujących." },
      { typ: "h2", tekst: "Jak korzystać z tabeli rozmiarów w naszym sklepie" },
      { typ: "p", tekst: "Na karcie każdego produktu znajdziesz przelicznik rozmiar–wiek–wzrost. Wystarczy porównać zmierzony wzrost dziecka z kolumną „wzrost (cm)” i odczytać odpowiadający rozmiar. Jeśli wahasz się między dwoma, wróć do zasady większego rozmiaru — a gdyby jednak coś nie pasowało, masz 14 dni na bezproblemowy zwrot." },
      { typ: "p", tekst: "Dobrze dobrany rozmiar to mniej zwrotów, zadowolone dziecko i ubranka, które służą cały sezon. Zmierz, sprawdź tabelę, w razie wątpliwości bierz większy — i gotowe." },
    ],
  },
  {
    slug: "wyprawka-dla-noworodka-lista-ubranek",
    tytul: "Wyprawka dla noworodka — lista niezbędnych ubranek",
    opis: "Co spakować do szpitala i przygotować na powrót do domu? Praktyczna, sprawdzona lista ubranek dla noworodka — bez zbędnych rzeczy i przepłacania.",
    data: "2026-07-25",
    czasCzytania: 7,
    kategoria: "Wyprawka",
    hue: 160,
    zdjecie: "/img/blog/wyprawka-dla-noworodka-lista-ubranek.jpg",
    tresc: [
      { typ: "p", tekst: "Kompletowanie wyprawki to jedna z najprzyjemniejszych części oczekiwania na dziecko — ale też łatwo dać się ponieść i kupić dwa razy za dużo. Prawda jest taka, że noworodek potrzebuje niewielu rzeczy, za to naprawdę wygodnych. Ten poradnik pomoże Ci przygotować sensowny zestaw na start, bez zapełniania szafy ubrankami, z których maluch wyrośnie w kilka tygodni." },
      { typ: "h2", tekst: "Ile kupować i w jakim rozmiarze" },
      { typ: "p", tekst: "Najczęstszy błąd to zakup wszystkiego w rozmiarze 56. Wiele dzieci rodzi się większych, a nawet te mniejsze rosną błyskawicznie. Rozłóż zakupy: kilka rzeczy w 56, większość w 62, a część od razu w 68. Dzięki temu nic się nie zmarnuje, a Ty unikniesz gorączkowych zakupów tuż po porodzie." },
      { typ: "h2", tekst: "Ubranka na start (rozmiar 56–68)" },
      { typ: "ul", punkty: [
        "body z długim rękawem — 5–7 szt.",
        "body z krótkim rękawem — 3–4 szt. (na cieplejsze dni i pod ubranka)",
        "pajacyki / śpiochy zapinane na zatrzaski — 4–6 szt.",
        "półśpiochy i spodenki — 3–4 szt.",
        "kaftaniki lub rozpinane bluzy — 2–3 szt.",
        "czapeczki bawełniane — 2 szt.",
        "skarpetki lub buciki niemowlęce — 3–4 pary",
        "rękawiczki-niedrapki — 1–2 pary",
        "pajac wyjściowy / rożek do wyjścia ze szpitala — 1 szt.",
      ] },
      { typ: "h2", tekst: "Co spakować do szpitala" },
      { typ: "p", tekst: "Do torby na porodówkę wystarczy skromny zestaw — resztę uzupełnisz w domu. Sprawdź też listę rzeczy zalecaną przez konkretny szpital, bo bywają różnice." },
      { typ: "ul", punkty: [
        "2–3 body z długim rękawem,",
        "2–3 pajacyki,",
        "czapeczka i para skarpetek,",
        "rożek lub kocyk na wyjście,",
        "komplet „wyjściowy” na drogę do domu.",
      ] },
      { typ: "h2", tekst: "Na co zwrócić uwagę przy zakupie" },
      { typ: "ul", punkty: [
        "zapięcia na zatrzaski z przodu i wzdłuż nogawek — ułatwiają przewijanie w nocy,",
        "miękka, przewiewna bawełna, najlepiej z certyfikatem OEKO-TEX,",
        "płaskie szwy i metki na zewnątrz — nie uciskają delikatnej skóry,",
        "brak sznurków, cekinów i drobnych elementów przy szyi,",
        "łatwe pranie w 40°C i zachowanie kształtu po wielu praniach.",
      ] },
      { typ: "h2", tekst: "Czego naprawdę nie musisz kupować od razu" },
      { typ: "p", tekst: "Sztywne dżinsy, buciki „na wyjście”, kilkanaście stylizacji w najmniejszym rozmiarze czy ubranka wyłącznie do prania ręcznego — to rzeczy, które w pierwszych tygodniach zwykle leżą nieużywane. Lepiej dokupić w razie potrzeby niż zostać z metkami. Postaw na wygodę i prostotę — noworodek i tak najlepiej czuje się w miękkim pajacyku blisko rodzica." },
      { typ: "p", tekst: "Dobrze przemyślana wyprawka to spokój w pierwszych dniach: masz pod ręką dokładnie to, co potrzebne, i nie tracisz pieniędzy na zbędne rzeczy. Skorzystaj z listy powyżej, dopasuj ją do pory roku i gotowe." },
    ],
  },
  {
    slug: "jak-ubierac-niemowle-warstwy-pory-roku",
    tytul: "Jak ubierać niemowlę? Warstwy i pory roku",
    opis: "Zasada warstw, reguła „jedna warstwa więcej niż dorosły” i praktyczne wskazówki, jak ubrać niemowlę latem, zimą i w przejściowe dni — bez przegrzewania i wychłodzenia.",
    data: "2026-07-15",
    czasCzytania: 6,
    kategoria: "Poradnik",
    hue: 230,
    zdjecie: "/img/blog/jak-ubierac-niemowle-warstwy-pory-roku.jpg",
    tresc: [
      { typ: "p", tekst: "Niemowlęta gorzej regulują temperaturę ciała niż dorośli — ich układ termoregulacji dopiero się rozwija. Dlatego zamiast jednego grubego ubrania sprawdza się ubieranie „na cebulkę”: w kilka cienkich warstw, które łatwo zdjąć, gdy zrobi się ciepło, i dołożyć, gdy się ochłodzi. To najprostszy sposób, by maluch był komfortowy przez cały dzień." },
      { typ: "h2", tekst: "Reguła jednej warstwy więcej" },
      { typ: "p", tekst: "Popularna i sprawdzona zasada mówi: ubierz niemowlę w tyle warstw, ile masz na sobie, plus jedna dodatkowa. Ta „jedna więcej” rekompensuje mniejszą aktywność ruchową dziecka, które nie rozgrzewa się tak jak Ty w ruchu." },
      { typ: "h2", tekst: "Jak sprawdzić, czy dziecku jest dobrze" },
      { typ: "p", tekst: "Nie kieruj się temperaturą dłoni ani stóp — u niemowląt są one naturalnie chłodniejsze i to zupełnie normalne. Najlepszym wskaźnikiem jest kark: włóż dwa palce pod ubranko na karku dziecka." },
      { typ: "ul", punkty: [
        "kark ciepły i suchy — wszystko w porządku,",
        "kark spocony, wilgotny, dziecko zaczerwienione — to przegrzanie, zdejmij warstwę,",
        "kark wyraźnie chłodny — dołóż warstwę lub okryj kocykiem.",
      ] },
      { typ: "p", tekst: "Przegrzewanie jest dla niemowlęcia bardziej ryzykowne niż lekkie wychłodzenie, dlatego przy wątpliwościach lepiej ubrać odrobinę lżej." },
      { typ: "h2", tekst: "Lato" },
      { typ: "ul", punkty: [
        "przewiewna, cienka bawełna w jasnych kolorach,",
        "body z krótkim rękawem lub samo body + luźne spodenki,",
        "cienka czapka lub kapelusz z daszkiem chroniący główkę,",
        "w upale wystarczy jedna warstwa — nie okrywaj dziecka „na wszelki wypadek”,",
        "unikaj bezpośredniego słońca, zwłaszcza między 11 a 15; w wózku używaj osłonki przeciwsłonecznej zamiast szczelnego przykrycia pieluchą, które grozi przegrzaniem.",
      ] },
      { typ: "h2", tekst: "Zima" },
      { typ: "ul", punkty: [
        "warstwa bazowa: body z długim rękawem przy skórze,",
        "warstwa środkowa: dres lub komplet dzianinowy,",
        "warstwa wierzchnia: kombinezon lub ocieplana kurtka,",
        "czapka zakrywająca uszy, skarpetki i rękawiczki,",
        "w wózku dokładaj śpiworek lub kocyk zamiast ubierać dziecko w kilka grubych kurtek,",
        "po wejściu do sklepu czy autobusu od razu rozepnij wierzchnią warstwę, żeby maluch się nie zgrzał.",
      ] },
      { typ: "h2", tekst: "Dni przejściowe (wiosna i jesień)" },
      { typ: "p", tekst: "To najtrudniejsza pogoda, bo temperatura potrafi zmienić się o kilkanaście stopni w ciągu dnia. Postaw na warstwy, które łatwo zdjąć: body, cienką bluzę i lekką kurtkę lub kamizelkę. Zabierz na spacer dodatkową warstwę w torbie — lepiej mieć ją pod ręką i nie użyć, niż marznąć." },
      { typ: "h2", tekst: "Fotelik samochodowy i sen" },
      { typ: "p", tekst: "W foteliku samochodowym unikaj grubego kombinezonu — zbyt puszysta warstwa sprawia, że pasy nie przylegają dobrze do ciała. Lepiej ubrać dziecko cieniej i okryć kocykiem na pasach. Do snu wybieraj lekką piżamkę lub śpiworek dobrany do temperatury pokoju (zalecane 18–20°C) — bez luźnych kocyków w łóżeczku najmłodszych dzieci." },
      { typ: "p", tekst: "Zapamiętaj jedną rzecz: warstwy dają Ci kontrolę. Sprawdzaj kark, reaguj na bieżąco i nie bój się zdejmować ubrań — komfortowe niemowlę to takie, któremu ani gorąco, ani zimno." },
    ],
  },
  {
    slug: "ubranka-do-zlobka-i-przedszkola",
    tytul: "Ubranka do żłobka i przedszkola — co się sprawdza",
    opis: "Wygodne, wspierające samodzielność i wytrzymałe. Podpowiadamy, jakie ubranka ułatwią dziecku dzień w żłobku i przedszkolu — i czego lepiej unikać.",
    data: "2026-07-05",
    czasCzytania: 5,
    kategoria: "Poradnik",
    hue: 40,
    zdjecie: "/img/blog/ubranka-do-zlobka-i-przedszkola.jpg",
    tresc: [
      { typ: "p", tekst: "W żłobku i przedszkolu ubranko musi zdać egzamin z trzech rzeczy naraz: wygody, samodzielności i wytrzymałości. Dziecko powinno móc samo je zdjąć i założyć (przy sikaniu, przebieraniu, wyjściu na dwór), a materiał — przetrwać zabawę, jedzenie, farby i codzienne pranie. Dobrze dobrana garderoba realnie ułatwia dziecku dzień i dodaje mu pewności siebie." },
      { typ: "h2", tekst: "Postaw na samodzielność" },
      { typ: "p", tekst: "Im mniej guzików, sznurków i skomplikowanych zapięć, tym lepiej. Dziecko, które samo poradzi sobie z ubraniem, szybciej wychodzi na plac zabaw i rzadziej czeka na pomoc pani. Ćwiczcie w domu ubieranie „na czas” — to świetna zabawa, która procentuje w grupie." },
      { typ: "h2", tekst: "Co się sprawdza" },
      { typ: "ul", punkty: [
        "dresy i legginsy z miękką gumką w pasie (bez guzików i pasków),",
        "bluzy i koszulki zakładane przez głowę zamiast zapinanych,",
        "body i koszulki z luźniejszym dekoltem, łatwe do samodzielnego założenia,",
        "buty na rzepy zamiast sznurowadeł,",
        "ubrania w ciemniejszych lub wzorzystych kolorach, na których mniej widać plamy,",
        "komplet na zmianę trzymany w plecaku lub w szatni.",
      ] },
      { typ: "h2", tekst: "Czego unikać" },
      { typ: "ul", punkty: [
        "kombinezonów i body z wieloma zatrzaskami — utrudniają szybkie skorzystanie z toalety,",
        "sztywnych jeansów, pasków i szelek,",
        "sznurków przy kapturach i długich troczków (względy bezpieczeństwa),",
        "ubrań „tylko do prania ręcznego” lub wymagających prasowania,",
        "delikatnych, drogich rzeczy, których żal pobrudzić — w przedszkolu i tak się ubrudzą.",
      ] },
      { typ: "h2", tekst: "Praktyczne drobiazgi, które robią różnicę" },
      { typ: "ul", punkty: [
        "podpisz metki imieniem dziecka — w grupie łatwo o pomyłki i zaginięcia,",
        "wybieraj kaptury odpinane lub bez sznurków,",
        "kilka warstw zamiast jednej grubej — w salach bywa ciepło, a na dworze chłodno,",
        "obuwie zmienne z antypoślizgową podeszwą.",
      ] },
      { typ: "p", tekst: "Zasada jest prosta: im wygodniej i prościej, tym lepiej — i dla dziecka, i dla opiekunów. Proste, wytrzymałe rzeczy, których nie żal pobrudzić, sprawdzają się w żłobku i przedszkolu najlepiej." },
    ],
  },
  {
    slug: "jak-prac-i-dbac-o-ubranka-dzieciece",
    tytul: "Jak prać i dbać o ubranka dziecięce",
    opis: "Temperatura prania, bezpieczne środki, usuwanie plam i triki na trwałość ubranek. Praktyczny poradnik pielęgnacji odzieży dla delikatnej skóry malucha.",
    data: "2026-06-28",
    czasCzytania: 5,
    kategoria: "Pielęgnacja",
    hue: 300,
    zdjecie: "/img/blog/jak-prac-i-dbac-o-ubranka-dzieciece.jpg",
    tresc: [
      { typ: "p", tekst: "Skóra dzieci jest cieńsza i bardziej wrażliwa niż skóra dorosłych, dlatego pranie ubranek warto potraktować nieco inaczej. Dobra wiadomość: nie trzeba żadnych skomplikowanych zabiegów — wystarczy kilka prostych zasad, żeby ubranka były bezpieczne dla malucha i służyły znacznie dłużej." },
      { typ: "h2", tekst: "Wypierz przed pierwszym założeniem" },
      { typ: "p", tekst: "Nowe ubranka zawsze pierz przed pierwszym użyciem — także te prosto z metką. Podczas produkcji, pakowania i transportu na tkaninie osadzają się pozostałości substancji i kurzu, które lepiej usunąć, zanim dotkną skóry noworodka." },
      { typ: "h2", tekst: "Temperatura i środki piorące" },
      { typ: "ul", punkty: [
        "pierz w 30–40°C — dla większości ubranek to optymalna temperatura (zawsze sprawdź metkę),",
        "wyższą temperaturę (60°C) stosuj tylko wtedy, gdy zaleca ją producent lub gdy chcesz wygotować pieluchy tetrowe,",
        "wybieraj delikatny proszek lub płyn przeznaczony dla dzieci — bez wybielaczy, enzymów i mocnych zapachów,",
        "unikaj płynów zmiękczających u niemowląt — mogą podrażniać i uczulać delikatną skórę,",
        "dobrze wypłucz pranie; jeśli Twoja pralka ma program „płukanie dodatkowe” lub „baby”, korzystaj z niego.",
      ] },
      { typ: "h2", tekst: "Usuwanie typowych plam" },
      { typ: "p", tekst: "Plamy po jedzeniu, trawie czy mleku najłatwiej usunąć, gdy są świeże. Kilka domowych sposobów działa lepiej niż agresywna chemia:" },
      { typ: "ul", punkty: [
        "namocz ubranko w letniej wodzie od razu, nie czekaj do wieczora,",
        "plamy tłuszczowe zasyp mąką ziemniaczaną lub potrzyj szarym mydłem,",
        "plamy z owoców i warzyw sprane letnią wodą; gorąca może je utrwalić,",
        "do odplamiania wybieraj środki dla dzieci lub mydło marsylskie zamiast wybielaczy chlorowych,",
        "zaplamione ubranko z nadrukiem odwróć na lewą stronę.",
      ] },
      { typ: "h2", tekst: "Suszenie i trwałość" },
      { typ: "ul", punkty: [
        "susz w cieniu — słońce i suszarka bębnowa szybciej niszczą kolory i elastyczność tkanin,",
        "ubranka z nadrukiem i haftem susz i prasuj na lewej stronie,",
        "prasuj w temperaturze zgodnej z metką; wiele dzianin w ogóle nie wymaga prasowania,",
        "zapinaj zatrzaski i rzepy przed praniem, żeby nie zaczepiały o inne rzeczy.",
      ] },
      { typ: "p", tekst: "Pamiętaj też, że bawełniane ubranka mogą lekko się skurczyć po pierwszym praniu — to normalne i warto uwzględnić przy wyborze rozmiaru. Niższa temperatura prania i suszenie w cieniu to najprostszy przepis na to, by ulubione body czy dres przetrwały nie jeden, a kilka sezonów — a często i kolejne dziecko." },
    ],
  },
];

export function znajdzArtykul(slug: string): Artykul | undefined {
  return ARTYKULY.find((a) => a.slug === slug);
}
