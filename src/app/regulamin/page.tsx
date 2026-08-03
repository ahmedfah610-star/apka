import { StronaInfo, Sekcja, Lista, Placeholder } from "@/components/StronaInfo";

export const metadata = { title: "Regulamin — Fasolka" };

export default function Regulamin() {
  return (
    <StronaInfo
      tytul="Regulamin sklepu"
      wstep="Szablon regulaminu sklepu internetowego. Uzupełnij dane i skonsultuj treść z prawnikiem przed publikacją."
      aktualizacja="[DATA]"
    >
      <Sekcja tytul="§1. Postanowienia ogólne">
        <p>
          Sklep internetowy działający pod adresem <Placeholder>[ADRES WWW]</Placeholder> („Sklep") prowadzony jest przez{" "}
          <Placeholder>[NAZWA FIRMY]</Placeholder> z siedzibą w <Placeholder>[ADRES]</Placeholder>, NIP{" "}
          <Placeholder>[NIP]</Placeholder>, REGON <Placeholder>[REGON]</Placeholder> („Sprzedawca").
        </p>
        <p>Kontakt: e-mail <Placeholder>[EMAIL]</Placeholder>, tel. <Placeholder>[TELEFON]</Placeholder>.</p>
      </Sekcja>

      <Sekcja tytul="§2. Definicje">
        <Lista
          punkty={[
            "Konsument — osoba fizyczna dokonująca zakupu niezwiązanego bezpośrednio z jej działalnością gospodarczą lub zawodową.",
            "Klient — każdy podmiot dokonujący zakupów w Sklepie.",
            "Umowa — umowa sprzedaży zawierana na odległość za pośrednictwem Sklepu.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="§3. Składanie zamówień">
        <p>
          Zamówienia można składać przez stronę Sklepu 24/7. Złożenie zamówienia i kliknięcie przycisku „Zamawiam i płacę"
          oznacza zawarcie umowy z obowiązkiem zapłaty. Warunkiem jest podanie danych niezbędnych do realizacji zamówienia.
        </p>
      </Sekcja>

      <Sekcja tytul="§4. Ceny i płatności (dyrektywa Omnibus)">
        <p>
          Wszystkie ceny są cenami brutto (zawierają podatek VAT) i podane są w złotych polskich. W przypadku obniżki ceny
          obok ceny promocyjnej prezentujemy najniższą cenę z 30 dni poprzedzających obniżkę, zgodnie z wymogami prawa.
        </p>
        <p>Dostępne metody płatności: BLIK, karta płatnicza, Przelewy24 <Placeholder>[oraz inne, jeśli dodasz]</Placeholder>.</p>
      </Sekcja>

      <Sekcja tytul="§5. Dostawa">
        <p>
          Sposoby, koszty i czas dostawy opisane są na stronie „Dostawa i zwroty". Zamówienia realizujemy na terenie{" "}
          <Placeholder>[OBSZAR]</Placeholder>.
        </p>
      </Sekcja>

      <Sekcja tytul="§6. Prawo odstąpienia od umowy">
        <p>
          Konsument (oraz przedsiębiorca na prawach konsumenta) może odstąpić od umowy w terminie 14 dni bez podania
          przyczyny, zgodnie z ustawą z dnia 30 maja 2014 r. o prawach konsumenta. Szczegóły oraz wzór formularza znajdują
          się na stronie „Dostawa i zwroty".
        </p>
      </Sekcja>

      <Sekcja tytul="§7. Reklamacje">
        <p>
          Sprzedawca odpowiada za zgodność towaru z umową na zasadach określonych w ustawie o prawach konsumenta.
          Reklamacje rozpatrujemy w terminie 14 dni od otrzymania zgłoszenia na adres <Placeholder>[EMAIL]</Placeholder>.
        </p>
      </Sekcja>

      <Sekcja tytul="§8. Dane osobowe">
        <p>
          Zasady przetwarzania danych opisane są w{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-akcent">Polityce prywatności</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="§9. Pozasądowe rozwiązywanie sporów">
        <p>
          Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, m.in.
          za pośrednictwem miejskiego lub powiatowego rzecznika konsumentów, Wojewódzkiego Inspektoratu Inspekcji
          Handlowej oraz stałego polubownego sądu konsumenckiego. Informacje dostępne są na stronie Urzędu Ochrony
          Konkurencji i Konsumentów (uokik.gov.pl).
        </p>
        <p className="text-[13.5px] text-ink-2">
          Uwaga: unijna platforma ODR (Online Dispute Resolution) zakończyła działalność 20 lipca 2025 r., dlatego
          nie zamieszczamy do niej odnośnika.
        </p>
      </Sekcja>

      <Sekcja tytul="§10. Postanowienia końcowe">
        <p>
          W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy
          o prawach konsumenta. Regulamin obowiązuje od dnia <Placeholder>[DATA]</Placeholder>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
