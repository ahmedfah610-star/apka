import { StronaInfo, Sekcja, Lista, DaneSprzedawcy } from "@/components/StronaInfo";

export const metadata = { title: "Regulamin" };

export default function Regulamin() {
  return (
    <StronaInfo
      tytul="Regulamin sklepu internetowego bobas-shopping"
      wstep="Regulamin określa zasady korzystania ze sklepu, składania zamówień, płatności, dostawy, prawa odstąpienia od umowy oraz postępowania reklamacyjnego."
      aktualizacja="4 sierpnia 2026"
    >
      <DaneSprzedawcy />

      <Sekcja tytul="§1. Postanowienia ogólne">
        <p>
          Niniejszy Regulamin określa zasady zawierania umów sprzedaży za pośrednictwem sklepu internetowego działającego
          pod adresem bobas-shopping.pl („Sklep") oraz zasady korzystania ze Sklepu przez Klientów.
        </p>
        <p>
          Sprzedawcą i administratorem Sklepu jest podmiot wskazany w danych sprzedawcy powyżej („Sprzedawca"). Kontakt ze
          Sprzedawcą możliwy jest za pomocą podanego adresu e-mail oraz numeru telefonu.
        </p>
        <p>
          Regulamin jest nieprzerwanie dostępny na stronie Sklepu w sposób umożliwiający jego pozyskanie, odtworzenie
          i utrwalenie (m.in. wydruk oraz zapisanie na trwałym nośniku) w każdej chwili.
        </p>
        <p>
          Klient zobowiązany jest do korzystania ze Sklepu w sposób zgodny z prawem i dobrymi obyczajami, z poszanowaniem
          dóbr osobistych oraz praw autorskich i własności intelektualnej Sprzedawcy i osób trzecich. Zakazane jest
          dostarczanie treści o charakterze bezprawnym.
        </p>
      </Sekcja>

      <Sekcja tytul="§2. Definicje">
        <Lista
          punkty={[
            "Konsument — osoba fizyczna zawierająca ze Sprzedawcą umowę w zakresie niezwiązanym bezpośrednio z jej działalnością gospodarczą lub zawodową.",
            "Przedsiębiorca na prawach konsumenta — osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści umowy wynika, że nie ma ona dla niej charakteru zawodowego; przysługuje jej ochrona przewidziana dla Konsumenta.",
            "Klient — każdy podmiot dokonujący zakupów w Sklepie.",
            "Sklep — sklep internetowy prowadzony przez Sprzedawcę pod wskazanym adresem.",
            "Towar — rzecz ruchoma (ubranka i akcesoria dziecięce) prezentowana w Sklepie, będąca przedmiotem umowy sprzedaży.",
            "Umowa sprzedaży — umowa zawierana na odległość między Klientem a Sprzedawcą za pośrednictwem Sklepu.",
            "Zamówienie — oświadczenie woli Klienta zmierzające bezpośrednio do zawarcia Umowy sprzedaży, określające rodzaj i liczbę Towarów.",
            "Dni robocze — dni od poniedziałku do piątku z wyłączeniem dni ustawowo wolnych od pracy.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="§3. Wymagania techniczne">
        <p>Do korzystania ze Sklepu, w tym przeglądania Towarów oraz składania Zamówień, niezbędne są:</p>
        <Lista
          punkty={[
            "urządzenie z dostępem do sieci Internet i aktualną przeglądarką internetową obsługującą JavaScript i pliki cookies,",
            "aktywne i poprawnie skonfigurowane konto poczty elektronicznej (e-mail),",
            "włączona obsługa plików cookies niezbędnych (m.in. do działania koszyka).",
          ]}
        />
        <p>
          Sprzedawca podejmuje działania w celu zapewnienia poprawnego działania Sklepu, jednak nie ponosi odpowiedzialności
          za przerwy wynikające z przyczyn niezależnych (np. działania siły wyższej, awarie po stronie dostawców usług).
        </p>
      </Sekcja>

      <Sekcja tytul="§4. Informacje o Towarach i cenach (dyrektywa Omnibus)">
        <p>
          Informacje o Towarach prezentowane w Sklepie, w szczególności ich opisy, parametry oraz ceny, stanowią zaproszenie
          do zawarcia umowy w rozumieniu art. 71 Kodeksu cywilnego.
        </p>
        <p>
          Wszystkie ceny podane w Sklepie są cenami brutto (zawierają podatek VAT) i wyrażone są w złotych polskich. Cena
          Towaru nie zawiera kosztów dostawy, które wskazywane są odrębnie w trakcie składania Zamówienia.
        </p>
        <p>
          W przypadku obniżenia ceny Towaru, obok informacji o obniżonej cenie prezentujemy najniższą cenę tego Towaru, która
          obowiązywała w okresie 30 dni przed wprowadzeniem obniżki, zgodnie z ustawą o informowaniu o cenach towarów i usług.
        </p>
        <p>
          Ceną wiążącą dla stron jest cena widniejąca przy Towarze w chwili złożenia Zamówienia przez Klienta.
        </p>
      </Sekcja>

      <Sekcja tytul="§5. Składanie i realizacja Zamówień">
        <p>
          Zamówienia można składać za pośrednictwem Sklepu przez 7 dni w tygodniu, 24 godziny na dobę. Do złożenia Zamówienia
          nie jest wymagane założenie konta — zakupów można dokonać jako gość, podając dane niezbędne do realizacji.
        </p>
        <p>W celu złożenia Zamówienia Klient:</p>
        <Lista
          punkty={[
            "dodaje wybrane Towary (z określeniem rozmiaru i liczby sztuk) do koszyka,",
            "przechodzi do koszyka i wybiera sposób dostawy oraz metodę płatności,",
            "podaje dane niezbędne do realizacji Zamówienia (dane odbiorcy, adres dostawy lub paczkomat, e-mail, telefon),",
            "potwierdza zapoznanie się z Regulaminem,",
            "składa Zamówienie klikając przycisk „Zamawiam i płacę”.",
          ]}
        />
        <p>
          Kliknięcie przycisku „Zamawiam i płacę” oznacza złożenie Zamówienia z obowiązkiem zapłaty i zawarcie Umowy sprzedaży.
          Po złożeniu Zamówienia Sprzedawca niezwłocznie potwierdza jego otrzymanie za pomocą wiadomości e-mail, co powoduje
          związanie Klienta treścią Zamówienia.
        </p>
        <p>
          Warunkiem realizacji Zamówienia jest dostępność Towaru. W przypadku braku dostępności części lub całości Towarów
          Sprzedawca niezwłocznie informuje o tym Klienta i, w razie dokonanej płatności, zwraca odpowiednią kwotę.
        </p>
      </Sekcja>

      <Sekcja tytul="§6. Metody płatności">
        <p>Klient może wybrać jedną z następujących metod płatności:</p>
        <Lista
          punkty={[
            "BLIK,",
            "karta płatnicza (Visa, Mastercard),",
            "szybki przelew online (Przelewy24).",
          ]}
        />
        <p>
          Podmiotem świadczącym obsługę płatności online w zakresie płatności BLIK oraz szybkich przelewów jest{" "}
          <strong>Przelewy24</strong> — PayPro SA, ul. Pastelowa 8, 60-198 Poznań, wpisana do Rejestru Przedsiębiorców
          Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy Poznań – Nowe Miasto i Wilda w Poznaniu, VIII Wydział
          Gospodarczy KRS pod numerem KRS 0000347935, NIP 7792369887, REGON 301345068.
        </p>
        <p>
          Operatorem kart płatniczych jest PayPro SA Agent Rozliczeniowy, ul. Pastelowa 8, 60-198 Poznań, wpisany do Rejestru
          Przedsiębiorców Krajowego Rejestru Sądowego prowadzonego przez Sąd Rejonowy Poznań – Nowe Miasto i Wilda w Poznaniu,
          VIII Wydział Gospodarczy Krajowego Rejestru Sądowego pod numerem KRS 0000347935, NIP 7792369887, REGON 301345068.
        </p>
        <p>
          Zamówienie zostaje przekazane do realizacji po zaksięgowaniu wpłaty. Brak wpłaty w terminie 3 dni od złożenia
          Zamówienia może skutkować jego anulowaniem.
        </p>
        <p>
          Na życzenie Klienta Sprzedawca wystawia fakturę. Chęć otrzymania faktury oraz dane do jej wystawienia należy podać
          podczas składania Zamówienia lub przekazać Sprzedawcy drogą e-mailową.
        </p>
      </Sekcja>

      <Sekcja tytul="§7. Dostawa">
        <p>
          Zamówienia realizowane są na terenie Rzeczypospolitej Polskiej. Dostępne sposoby oraz koszty i czas dostawy
          wskazane są w trakcie składania Zamówienia oraz na stronie{" "}
          <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>.
        </p>
        <p>
          Czas realizacji Zamówienia (przygotowanie i nadanie) wynosi zwykle 1–2 dni robocze, liczone od dnia zaksięgowania
          płatności, powiększone o czas dostawy przewoźnika.
        </p>
      </Sekcja>

      <Sekcja tytul="§8. Prawo odstąpienia od umowy (14 dni)">
        <p>
          Konsument oraz przedsiębiorca na prawach konsumenta, który zawarł umowę na odległość, może w terminie
          <strong> 14 dni</strong> odstąpić od niej bez podania przyczyny i bez ponoszenia kosztów innych niż wskazane
          poniżej, zgodnie z ustawą z dnia 30 maja 2014 r. o prawach konsumenta.
        </p>
        <p>
          Termin do odstąpienia wygasa po upływie 14 dni od dnia, w którym Konsument (lub wskazana przez niego osoba inna
          niż przewoźnik) wszedł w posiadanie Towaru, a w przypadku wielu Towarów dostarczanych osobno — od objęcia w posiadanie
          ostatniego z nich.
        </p>
        <p>
          Aby skorzystać z prawa odstąpienia, należy poinformować Sprzedawcę o swojej decyzji w drodze jednoznacznego
          oświadczenia (np. pismo wysłane pocztą lub e-mailem). Można skorzystać ze wzoru formularza odstąpienia dostępnego
          na stronie „Dostawa i zwroty", choć nie jest to obowiązkowe. Do zachowania terminu wystarczy wysłanie oświadczenia
          przed jego upływem.
        </p>
        <p>
          Konsument ma obowiązek zwrócić Towar niezwłocznie, nie później niż w terminie 14 dni od dnia odstąpienia. Bezpośrednie
          koszty zwrotu Towaru ponosi Konsument. Konsument odpowiada za zmniejszenie wartości Towaru wynikające z korzystania
          z niego w sposób wykraczający poza konieczny do stwierdzenia charakteru, cech i funkcjonowania Towaru.
        </p>
        <p>
          Sprzedawca niezwłocznie, nie później niż w terminie 14 dni od otrzymania oświadczenia o odstąpieniu, zwraca
          wszystkie otrzymane płatności, w tym koszty dostawy (z wyjątkiem dodatkowych kosztów wynikających z wybranego przez
          Konsumenta sposobu dostawy innego niż najtańszy zwykły oferowany przez Sprzedawcę). Zwrot następuje przy użyciu tej
          samej metody płatności, chyba że Konsument zgodzi się na inne rozwiązanie. Sprzedawca może wstrzymać się ze zwrotem
          do chwili otrzymania Towaru lub dowodu jego odesłania.
        </p>
      </Sekcja>

      <Sekcja tytul="§9. Wyjątki od prawa odstąpienia">
        <p>Prawo odstąpienia nie przysługuje w odniesieniu do umów wskazanych w art. 38 ustawy o prawach konsumenta, m.in.:</p>
        <Lista
          punkty={[
            "Towarów nieprefabrykowanych, wyprodukowanych według specyfikacji Konsumenta lub służących zaspokojeniu jego zindywidualizowanych potrzeb,",
            "Towarów dostarczanych w zapieczętowanym opakowaniu, których po otwarciu nie można zwrócić ze względu na ochronę zdrowia lub higienę, jeżeli opakowanie zostało otwarte po dostarczeniu,",
            "Towarów, które po dostarczeniu, ze względu na swój charakter, zostają nierozłącznie połączone z innymi rzeczami.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="§10. Reklamacje — niezgodność Towaru z umową">
        <p>
          Sprzedawca ma obowiązek dostarczyć Towar zgodny z umową i odpowiada wobec Konsumenta za jego niezgodność na zasadach
          określonych w rozdziale 5a ustawy o prawach konsumenta. Sprzedawca ponosi odpowiedzialność za niezgodność istniejącą
          w chwili dostarczenia Towaru i ujawnioną w ciągu 2 lat od tej chwili.
        </p>
        <p>
          W przypadku niezgodności Towaru z umową Konsument może żądać jego naprawy lub wymiany, a w dalszej kolejności — złożyć
          oświadczenie o obniżeniu ceny albo odstąpieniu od umowy, na zasadach i w przypadkach określonych w ustawie.
        </p>
        <p>
          Reklamację można złożyć drogą e-mailową na adres Sprzedawcy lub pisemnie. W zgłoszeniu warto opisać wadę, wskazać
          żądanie oraz podać dane kontaktowe i numer Zamówienia. Sprzedawca rozpatruje reklamację niezwłocznie, nie później
          niż w terminie 14 dni od jej otrzymania i informuje Klienta o sposobie jej rozpatrzenia.
        </p>
        <p>
          Do Klientów niebędących Konsumentami (przedsiębiorców) stosuje się przepisy Kodeksu cywilnego o rękojmi; strony mogą
          jej zakres ograniczyć lub wyłączyć w zakresie dozwolonym prawem.
        </p>
      </Sekcja>

      <Sekcja tytul="§11. Pozasądowe sposoby rozpatrywania reklamacji i dochodzenia roszczeń">
        <p>
          Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, m.in.:
        </p>
        <Lista
          punkty={[
            "zwrócenia się do stałego polubownego sądu konsumenckiego z wnioskiem o rozstrzygnięcie sporu,",
            "zwrócenia się do wojewódzkiego inspektora Inspekcji Handlowej z wnioskiem o wszczęcie postępowania mediacyjnego,",
            "skorzystania z bezpłatnej pomocy powiatowego (miejskiego) rzecznika konsumentów lub organizacji społecznej, do której zadań statutowych należy ochrona konsumentów.",
          ]}
        />
        <p>
          Szczegółowe informacje dostępne są na stronie Urzędu Ochrony Konkurencji i Konsumentów (uokik.gov.pl). Skorzystanie
          z pozasądowych sposobów jest dobrowolne i możliwe tylko po zgodzie obu stron sporu.
        </p>
        <p className="text-[13.5px] text-ink-2">
          Informacja: unijna platforma internetowego rozstrzygania sporów (ODR) zakończyła działalność 20 lipca 2025 r.,
          dlatego nie zamieszczamy do niej odnośnika.
        </p>
      </Sekcja>

      <Sekcja tytul="§12. Newsletter">
        <p>
          Klient może dobrowolnie wyrazić zgodę na otrzymywanie newslettera, podając adres e-mail. Zgoda może zostać w każdej
          chwili wycofana poprzez kliknięcie linku rezygnacji w treści wiadomości lub kontakt ze Sprzedawcą. Usługa newslettera
          świadczona jest nieodpłatnie.
        </p>
      </Sekcja>

      <Sekcja tytul="§13. Dane osobowe">
        <p>
          Administratorem danych osobowych Klientów jest Sprzedawca. Zasady przetwarzania danych oraz prawa osób, których dane
          dotyczą, opisane są w{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-akcent">Polityce prywatności</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="§14. Własność intelektualna i opinie">
        <p>
          Treści udostępniane w Sklepie, w tym zdjęcia, opisy, logo i układ graficzny, podlegają ochronie prawnej i nie mogą
          być wykorzystywane bez zgody uprawnionych podmiotów.
        </p>
        <p>
          Jeżeli Sklep umożliwia wystawianie opinii o Towarach, Sprzedawca podejmuje uzasadnione działania, aby publikowane
          opinie pochodziły od Klientów, którzy nabyli lub używali danego Towaru.
        </p>
      </Sekcja>

      <Sekcja tytul="§15. Postanowienia końcowe">
        <p>
          W sprawach nieuregulowanych w Regulaminie zastosowanie mają powszechnie obowiązujące przepisy prawa polskiego,
          w szczególności Kodeksu cywilnego, ustawy o prawach konsumenta oraz ustawy o świadczeniu usług drogą elektroniczną.
        </p>
        <p>
          Sprzedawca zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn (np. zmiana przepisów prawa, sposobów
          płatności i dostaw). Do Zamówień złożonych przed wejściem w życie zmian stosuje się Regulamin w brzmieniu
          obowiązującym w chwili złożenia Zamówienia. O zmianach Klienci posiadający konto informowani są z wyprzedzeniem.
        </p>
        <p>
          Regulamin obowiązuje od dnia 4 sierpnia 2026 r.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
