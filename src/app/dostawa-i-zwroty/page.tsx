import { StronaInfo, Sekcja, Lista, Ramka } from "@/components/StronaInfo";

export const metadata = { title: "Dostawa i zwroty" };

export default function DostawaZwroty() {
  return (
    <StronaInfo
      tytul="Dostawa i zwroty"
      wstep="Wygodna wysyłka InPost oraz 14 dni na zwrot bez podania przyczyny. Poniżej znajdziesz wszystkie zasady i wzór formularza odstąpienia."
    >
      <Sekcja tytul="Sposoby i koszt dostawy">
        <Lista
          punkty={[
            <>InPost Paczkomat (ekonomiczny) — <strong>10,50 zł</strong></>,
            <>InPost Paczkomat 24/7 (standard) — <strong>14,60 zł</strong></>,
            <>ORLEN Paczka (punkt) — <strong>11,99 zł</strong></>,
            <>DPD Pickup (punkt) — <strong>10,99 zł</strong></>,
            <>Pocztex (punkt) — <strong>12,99 zł</strong></>,
            <>Kurier InPost (pod adres) — <strong>14,99 zł</strong></>,
            <>Kurier DHL (pod adres) — <strong>19,99 zł</strong></>,
            <>Darmowa dostawa dla zamówień powyżej <strong>150 zł</strong></>,
          ]}
        />
        <p>
          Zamówienia wysyłamy na terenie Polski. Czas realizacji (przygotowanie i nadanie) to zwykle 1–2 dni robocze od
          zaksięgowania płatności, powiększony o czas dostawy przewoźnika (najczęściej 1–2 dni robocze).
        </p>
        <p>
          Po nadaniu paczki otrzymasz e-mail z numerem przesyłki, dzięki któremu możesz śledzić jej status.
        </p>
      </Sekcja>

      <Sekcja tytul="Prawo odstąpienia od umowy (14 dni)">
        <p>
          Jako Konsument (a także przedsiębiorca na prawach konsumenta) masz prawo odstąpić od umowy zawartej na odległość
          w terminie <strong>14 dni</strong> bez podawania przyczyny i bez ponoszenia kosztów innych niż bezpośredni koszt
          odesłania Towaru. Termin liczony jest od dnia, w którym otrzymałeś Towar (lub ostatnią część zamówienia).
        </p>
        <p>
          Aby odstąpić od umowy, poinformuj nas o swojej decyzji jednoznacznym oświadczeniem — najwygodniej e-mailem na{" "}
          <a href="mailto:amin.kids1@hotmail.com" className="underline underline-offset-2 hover:text-akcent">amin.kids1@hotmail.com</a> lub pisemnie na adres do zwrotów. Możesz skorzystać z poniższego wzoru
          formularza, ale nie jest to obowiązkowe. Do zachowania terminu wystarczy wysłanie oświadczenia przed jego upływem.
        </p>
        <p>
          Zwracany Towar odeślij niezwłocznie, nie później niż w ciągu 14 dni od odstąpienia, na adres:{" "}
          AMIN.KIDS Sp. z o.o., ul. Tomasza Zana 43/2.1, 20-601 Lublin. Bezpośrednie koszty odesłania Towaru ponosi kupujący. Prosimy
          o dołączenie informacji pozwalającej powiązać zwrot z zamówieniem (np. numer zamówienia).
        </p>
        <p>
          Zwrotu wszystkich otrzymanych płatności — w tym kosztów najtańszej oferowanej przez nas dostawy — dokonamy
          niezwłocznie, nie później niż w ciągu 14 dni, tą samą metodą płatności, której użyłeś, chyba że zgodzisz się na inne
          rozwiązanie. Możemy wstrzymać się ze zwrotem do chwili otrzymania Towaru lub dowodu jego odesłania — w zależności od
          tego, co nastąpi wcześniej.
        </p>
        <p className="text-[13.5px] text-ink-2">
          Odpowiadasz za zmniejszenie wartości Towaru wynikające z korzystania z niego w sposób wykraczający poza niezbędny do
          stwierdzenia jego charakteru, cech i funkcjonowania (podobnie jak przy przymierzaniu w sklepie stacjonarnym).
        </p>
      </Sekcja>

      <Sekcja tytul="Wzór formularza odstąpienia od umowy">
        <Ramka>
          <p>Adresat: AMIN.KIDS Sp. z o.o., ul. Tomasza Zana 43/2.1, 20-601 Lublin, amin.kids1@hotmail.com</p>
          <p className="mt-2">
            Ja/My niniejszym informuję/informujemy o moim/naszym odstąpieniu od umowy sprzedaży następujących rzeczy: ______________
          </p>
          <p className="mt-2">Data zawarcia umowy / odbioru Towaru: ______________</p>
          <p>Numer zamówienia: ______________</p>
          <p>Imię i nazwisko konsumenta: ______________</p>
          <p>Adres konsumenta: ______________</p>
          <p>Numer rachunku do zwrotu (jeśli inny niż użyty do płatności): ______________</p>
          <p>Data i podpis (jeśli formularz przesyłany jest w wersji papierowej): ______________</p>
        </Ramka>
      </Sekcja>

      <Sekcja tytul="Reklamacje (niezgodność Towaru z umową)">
        <p>
          Jeśli otrzymany Towar jest niezgodny z umową (np. wadliwy lub uszkodzony), przysługują Ci uprawnienia określone
          w ustawie o prawach konsumenta. Możesz żądać naprawy albo wymiany Towaru, a w dalszej kolejności — obniżenia ceny
          lub odstąpienia od umowy, na zasadach wskazanych w ustawie i w Regulaminie.
        </p>
        <p>
          Reklamację zgłoś na adres <a href="mailto:amin.kids1@hotmail.com" className="underline underline-offset-2 hover:text-akcent">amin.kids1@hotmail.com</a>, opisując wadę, wskazując swoje żądanie oraz
          podając numer zamówienia. Reklamację rozpatrzymy niezwłocznie, nie później niż w terminie 14 dni od jej otrzymania.
        </p>
      </Sekcja>

      <Sekcja tytul="Wyjątki od prawa odstąpienia">
        <p>
          Prawo odstąpienia nie przysługuje m.in. w odniesieniu do Towarów wykonanych na indywidualne zamówienie lub według
          specyfikacji Konsumenta oraz Towarów dostarczanych w zapieczętowanym opakowaniu, których po otwarciu nie można
          zwrócić ze względu na ochronę zdrowia lub higienę, jeżeli opakowanie zostało otwarte po dostarczeniu. Pełny katalog
          wyjątków znajduje się w{" "}
          <a href="/regulamin" className="underline underline-offset-2 hover:text-akcent">Regulaminie</a>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
