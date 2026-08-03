import { StronaInfo, Sekcja, Lista } from "@/components/StronaInfo";

export const metadata = { title: "Polityka cookies" };

export default function Cookies() {
  return (
    <StronaInfo
      tytul="Polityka cookies"
      wstep="Informacja o plikach cookies i podobnych technologiach."
      aktualizacja="[DATA]"
    >
      <Sekcja tytul="Czym są pliki cookies">
        <p>
          Cookies to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu. Używamy ich, aby sklep działał poprawnie,
          a także — za Twoją zgodą — do celów analitycznych i marketingowych.
        </p>
      </Sekcja>

      <Sekcja tytul="Rodzaje cookies">
        <Lista
          punkty={[
            "Niezbędne — konieczne do działania sklepu (koszyk, sesja, bezpieczeństwo). Nie wymagają zgody.",
            "Analityczne — pomagają zrozumieć, jak korzystasz ze sklepu. Wymagają zgody.",
            "Marketingowe — służą do personalizacji reklam. Wymagają zgody.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="Zgoda i jej wycofanie">
        <p>
          Przy pierwszej wizycie wyświetlamy baner, w którym możesz zaakceptować wszystkie cookies lub ograniczyć się do
          niezbędnych. Zgodę możesz w każdej chwili zmienić lub wycofać, czyszcząc dane strony w przeglądarce lub kontaktując
          się z nami. Odmowa zgody jest równie łatwa jak jej wyrażenie.
        </p>
      </Sekcja>

      <Sekcja tytul="Zarządzanie w przeglądarce">
        <p>
          Możesz zarządzać cookies w ustawieniach przeglądarki — zablokować je lub usunąć. Wyłączenie niezbędnych cookies
          może utrudnić korzystanie ze sklepu (np. z koszyka).
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
