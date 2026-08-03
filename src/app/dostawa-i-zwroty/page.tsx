import { StronaInfo, Sekcja, Lista, Placeholder } from "@/components/StronaInfo";

export const metadata = { title: "Dostawa i zwroty" };

export default function DostawaZwroty() {
  return (
    <StronaInfo tytul="Dostawa i zwroty" wstep="Wysyłka InPost oraz 14 dni na zwrot bez podania przyczyny.">
      <Sekcja tytul="Sposoby i koszt dostawy">
        <Lista
          punkty={[
            <>InPost Paczkomat 24/7 — <Placeholder>[KOSZT]</Placeholder> zł</>,
            <>InPost Kurier — <Placeholder>[KOSZT]</Placeholder> zł</>,
            <>Kurier standardowy — <Placeholder>[KOSZT]</Placeholder> zł</>,
            <>Darmowa dostawa od <Placeholder>[KWOTA]</Placeholder> zł</>,
          ]}
        />
        <p>Czas realizacji: zwykle <Placeholder>[X]</Placeholder> dni roboczych. Wysyłamy na terenie Polski.</p>
      </Sekcja>

      <Sekcja tytul="Prawo odstąpienia od umowy (14 dni)">
        <p>
          Jako konsument masz prawo odstąpić od umowy zawartej na odległość w terminie <strong>14 dni</strong> bez
          podania przyczyny (ustawa o prawach konsumenta). Termin liczy się od dnia otrzymania towaru.
        </p>
        <p>
          Aby odstąpić, poinformuj nas o tym jednoznacznym oświadczeniem — e-mailem na <Placeholder>[EMAIL]</Placeholder>
          {" "}lub pocztą na adres do zwrotów. Możesz skorzystać ze wzoru formularza odstąpienia (poniżej), ale nie jest to obowiązkowe.
        </p>
        <p>
          Zwracany towar odeślij nie później niż 14 dni od odstąpienia na adres: <Placeholder>[ADRES DO ZWROTÓW]</Placeholder>.
          Bezpośrednie koszty zwrotu towaru ponosi kupujący.
        </p>
        <p>
          Zwrot płatności (w tym kosztów najtańszej oferowanej dostawy) nastąpi niezwłocznie, nie później niż w ciągu
          14 dni, tą samą metodą płatności, chyba że wyrazisz zgodę na inny sposób. Możemy wstrzymać zwrot do czasu
          otrzymania towaru lub dowodu jego odesłania.
        </p>
      </Sekcja>

      <Sekcja tytul="Wzór formularza odstąpienia od umowy">
        <div className="border border-linia bg-szary/40 p-4 text-[14px] leading-relaxed text-ink-2">
          <p>Adresat: <Placeholder>[NAZWA FIRMY, ADRES, EMAIL]</Placeholder></p>
          <p className="mt-2">Ja/My niniejszym informuję/informujemy o moim/naszym odstąpieniu od umowy sprzedaży następujących rzeczy: ______________</p>
          <p className="mt-2">Data zawarcia umowy / odbioru: ______________</p>
          <p>Imię i nazwisko konsumenta: ______________</p>
          <p>Adres konsumenta: ______________</p>
          <p>Numer zamówienia: ______________</p>
          <p>Data i podpis (jeśli formularz przesyłany w wersji papierowej): ______________</p>
        </div>
      </Sekcja>

      <Sekcja tytul="Reklamacje (rękojmia / niezgodność towaru z umową)">
        <p>
          Jeśli towar jest niezgodny z umową, przysługują Ci uprawnienia z tytułu rękojmi/niezgodności towaru z umową
          zgodnie z ustawą o prawach konsumenta. Reklamację zgłoś na <Placeholder>[EMAIL]</Placeholder>, opisując wadę.
          Rozpatrzymy ją w terminie 14 dni.
        </p>
      </Sekcja>

      <Sekcja tytul="Wyjątki od prawa odstąpienia">
        <p>
          Prawo odstąpienia nie przysługuje m.in. dla towarów wykonanych na indywidualne zamówienie oraz towarów
          zapieczętowanych, których po otwarciu nie można zwrócić ze względów higienicznych, jeśli opakowanie zostało otwarte.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
