import { StronaInfo, Sekcja, Lista } from "@/components/StronaInfo";

export const metadata = { title: "Polityka cookies" };

type Wiersz = { nazwa: string; cel: string; typ: string; czas: string };

const COOKIES: Wiersz[] = [
  { nazwa: "fasolka-koszyk", cel: "Zapamiętanie zawartości koszyka", typ: "Niezbędny", czas: "Do zamknięcia lub wyczyszczenia" },
  { nazwa: "fasolka-ulubione", cel: "Lista produktów ulubionych", typ: "Niezbędny (funkcjonalny)", czas: "Do wyczyszczenia" },
  { nazwa: "fasolka-zgoda-cookies", cel: "Zapamiętanie Twojej decyzji o cookies", typ: "Niezbędny", czas: "12 miesięcy" },
  { nazwa: "fasolka-ostatnio", cel: "Ostatnio oglądane produkty", typ: "Funkcjonalny", czas: "Do wyczyszczenia" },
  { nazwa: "cookies operatora płatności", cel: "Bezpieczna obsługa płatności online", typ: "Niezbędny", czas: "Wg dostawcy płatności" },
];

export default function Cookies() {
  return (
    <StronaInfo
      tytul="Polityka cookies"
      wstep="Wyjaśniamy, czym są pliki cookies, w jakim celu je wykorzystujemy oraz jak możesz zarządzać zgodą i ustawieniami przeglądarki."
      aktualizacja="4 sierpnia 2026"
    >
      <Sekcja tytul="Czym są pliki cookies">
        <p>
          Pliki cookies („ciasteczka") to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu podczas korzystania ze
          Sklepu. Umożliwiają one m.in. utrzymanie sesji, zapamiętanie zawartości koszyka oraz — za Twoją zgodą — analizę
          ruchu i personalizację treści. Obok cookies wykorzystujemy zbliżone technologie, takie jak pamięć lokalna
          przeglądarki (localStorage), którą traktujemy analogicznie do cookies.
        </p>
      </Sekcja>

      <Sekcja tytul="Rodzaje wykorzystywanych cookies">
        <Lista
          punkty={[
            "Niezbędne — konieczne do prawidłowego działania Sklepu (m.in. koszyk, sesja, bezpieczeństwo płatności). Nie wymagają zgody, ponieważ bez nich Sklep nie działa poprawnie.",
            "Funkcjonalne — zapamiętują Twoje preferencje (np. ostatnio oglądane produkty, ulubione), zwiększając wygodę korzystania.",
            "Analityczne — pomagają nam zrozumieć, jak korzystasz ze Sklepu, aby go ulepszać. Instalowane są wyłącznie za Twoją zgodą.",
            "Marketingowe — służą do prezentowania dopasowanych treści i reklam. Instalowane są wyłącznie za Twoją zgodą.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="Szczegółowy wykaz cookies">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-linia text-left text-ink-2">
                <th className="py-2 pr-3 font-semibold">Nazwa / źródło</th>
                <th className="py-2 pr-3 font-semibold">Cel</th>
                <th className="py-2 pr-3 font-semibold">Typ</th>
                <th className="py-2 font-semibold">Czas przechowywania</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c) => (
                <tr key={c.nazwa} className="border-b border-linia/70 align-top">
                  <td className="py-2.5 pr-3 font-medium text-ink">{c.nazwa}</td>
                  <td className="py-2.5 pr-3 text-ink-2">{c.cel}</td>
                  <td className="py-2.5 pr-3 text-ink-2">{c.typ}</td>
                  <td className="py-2.5 text-ink-2">{c.czas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13.5px] text-ink-2">
          Wykaz ma charakter poglądowy i może się zmieniać wraz z rozwojem Sklepu oraz narzędzi zewnętrznych dostawców.
        </p>
      </Sekcja>

      <Sekcja tytul="Zgoda i jej wycofanie">
        <p>
          Podczas pierwszej wizyty wyświetlamy baner, w którym możesz zaakceptować wszystkie pliki cookies albo ograniczyć się
          wyłącznie do niezbędnych. Odmowa zgody jest równie prosta i widoczna jak jej wyrażenie — nie stosujemy mechanizmów
          utrudniających rezygnację. Cookies wymagające zgody nie są instalowane, dopóki jej nie wyrazisz.
        </p>
        <p>
          Zgodę możesz w każdej chwili zmienić lub wycofać, usuwając dane witryny w przeglądarce albo kontaktując się z nami.
          Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.
        </p>
      </Sekcja>

      <Sekcja tytul="Zarządzanie cookies w przeglądarce">
        <p>
          Ustawienia dotyczące cookies możesz w każdej chwili zmienić w swojej przeglądarce — zablokować je, ograniczyć lub
          usunąć już zapisane pliki. Instrukcje znajdziesz w pomocy używanej przeglądarki (Chrome, Firefox, Safari, Edge).
          Pamiętaj, że wyłączenie cookies niezbędnych może utrudnić lub uniemożliwić korzystanie z części funkcji Sklepu,
          w szczególności z koszyka i procesu składania zamówienia.
        </p>
      </Sekcja>

      <Sekcja tytul="Dane osobowe a cookies">
        <p>
          Informacje zbierane za pomocą cookies mogą stanowić dane osobowe. Zasady ich przetwarzania oraz Twoje prawa opisane
          są w{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-akcent">Polityce prywatności</a>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
