import { StronaInfo, Sekcja, Lista, Placeholder, DaneSprzedawcy } from "@/components/StronaInfo";

export const metadata = { title: "Polityka prywatności" };

export default function PolitykaPrywatnosci() {
  return (
    <StronaInfo
      tytul="Polityka prywatności"
      wstep="Dbamy o Twoją prywatność. Poniżej wyjaśniamy, jakie dane zbieramy, w jakim celu i na jakiej podstawie prawnej je przetwarzamy oraz jakie prawa Ci przysługują — zgodnie z RODO."
      aktualizacja="[DATA]"
    >
      <Sekcja tytul="1. Administrator danych">
        <p>Administratorem Twoich danych osobowych jest Sprzedawca prowadzący sklep internetowy bobas-shopping:</p>
        <DaneSprzedawcy />
        <p>
          We wszystkich sprawach dotyczących przetwarzania danych osobowych oraz korzystania z przysługujących Ci praw możesz
          kontaktować się z nami za pomocą podanego wyżej adresu e-mail. <Placeholder>[Jeśli powołano Inspektora Ochrony
          Danych — podaj jego dane kontaktowe.]</Placeholder>
        </p>
      </Sekcja>

      <Sekcja tytul="2. Jakie dane przetwarzamy">
        <Lista
          punkty={[
            "Dane niezbędne do realizacji zamówienia: imię i nazwisko, adres dostawy lub numer paczkomatu, adres e-mail, numer telefonu.",
            "Dane do faktury (jeśli jej zażądasz): nazwa, adres, NIP.",
            "Dane rozliczeniowe — obsługiwane bezpośrednio przez operatora płatności; nie przechowujemy pełnych danych kart płatniczych.",
            "Adres e-mail — w przypadku zapisu na newsletter lub powiadomienie o dostępności produktu.",
            "Treść korespondencji — gdy kontaktujesz się z nami w sprawie zamówienia, zwrotu lub reklamacji.",
            "Dane techniczne: adres IP, informacje o urządzeniu i przeglądarce oraz pliki cookies (zob. Polityka cookies).",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="3. Cele i podstawy prawne przetwarzania">
        <Lista
          punkty={[
            "Realizacja zamówienia i wykonanie umowy sprzedaży — art. 6 ust. 1 lit. b RODO (niezbędność do wykonania umowy).",
            "Wypełnienie obowiązków prawnych, m.in. podatkowych i rachunkowych (wystawianie i przechowywanie faktur) — art. 6 ust. 1 lit. c RODO.",
            "Rozpatrywanie reklamacji i obsługa zwrotów — art. 6 ust. 1 lit. b oraz lit. c RODO.",
            "Wysyłka newslettera oraz powiadomień o dostępności — Twoja zgoda, art. 6 ust. 1 lit. a RODO.",
            "Ustalenie, dochodzenie i obrona roszczeń oraz zapewnienie bezpieczeństwa Sklepu — prawnie uzasadniony interes administratora, art. 6 ust. 1 lit. f RODO.",
            "Analityka i statystyka (w zakresie cookies analitycznych) — Twoja zgoda, art. 6 ust. 1 lit. a RODO.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="4. Odbiorcy danych">
        <p>
          Twoje dane możemy powierzać zaufanym podmiotom przetwarzającym, wyłącznie w zakresie niezbędnym do świadczenia
          usług i na podstawie umów powierzenia przetwarzania danych. Są to w szczególności:
        </p>
        <Lista
          punkty={[
            "operator płatności — obsługa i rozliczenie transakcji,",
            "firmy kurierskie i operatorzy logistyczni (m.in. InPost) — dostawa zamówień,",
            "dostawcy hostingu, infrastruktury oraz bazy danych (m.in. Vercel, Supabase) — utrzymanie Sklepu,",
            "dostawca usługi wysyłki wiadomości e-mail (m.in. Resend) — wiadomości transakcyjne i newsletter,",
            <Placeholder key="brk">[biuro rachunkowe — jeśli korzystasz]</Placeholder>,
            "uprawnione organy państwowe — gdy obowiązek udostępnienia wynika z przepisów prawa.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="5. Przekazywanie danych poza EOG">
        <p>
          Niektórzy dostawcy usług mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym (EOG). W takim przypadku
          przekazanie odbywa się wyłącznie przy zapewnieniu odpowiednich zabezpieczeń, w szczególności na podstawie
          standardowych klauzul umownych zatwierdzonych przez Komisję Europejską lub decyzji stwierdzającej odpowiedni
          stopień ochrony. Na życzenie udostępnimy informację o zastosowanych zabezpieczeniach.
        </p>
      </Sekcja>

      <Sekcja tytul="6. Okres przechowywania danych">
        <Lista
          punkty={[
            "Dane związane z zamówieniami i umowami — przez okres realizacji, a następnie przez czas wymagany przepisami podatkowymi i rachunkowymi (co do zasady 5 lat licząc od końca roku, w którym wystawiono dokument).",
            "Dane przetwarzane na podstawie zgody (newsletter, powiadomienia, cookies) — do czasu wycofania zgody.",
            "Dane niezbędne do ustalenia lub dochodzenia roszczeń — do upływu terminów przedawnienia.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="7. Twoje prawa">
        <p>W związku z przetwarzaniem danych przysługują Ci następujące prawa:</p>
        <Lista
          punkty={[
            "prawo dostępu do danych oraz uzyskania ich kopii,",
            "prawo do sprostowania (poprawienia) danych,",
            "prawo do usunięcia danych („prawo do bycia zapomnianym”),",
            "prawo do ograniczenia przetwarzania,",
            "prawo do przenoszenia danych,",
            "prawo do wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie,",
            "prawo do cofnięcia zgody w dowolnym momencie — bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.",
          ]}
        />
        <p>
          Aby skorzystać z powyższych praw, skontaktuj się z nami mailowo. Masz również prawo wniesienia skargi do organu
          nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).
        </p>
      </Sekcja>

      <Sekcja tytul="8. Dobrowolność podania danych">
        <p>
          Podanie danych jest dobrowolne, jednak niezbędne do zawarcia i realizacji umowy sprzedaży — bez podania danych
          niezbędnych do wysyłki nie będzie możliwe zrealizowanie zamówienia. Podanie adresu e-mail na potrzeby newslettera
          jest w pełni dobrowolne.
        </p>
      </Sekcja>

      <Sekcja tytul="9. Zautomatyzowane podejmowanie decyzji i profilowanie">
        <p>
          Twoje dane nie są wykorzystywane do zautomatyzowanego podejmowania decyzji, w tym profilowania, które wywoływałoby
          wobec Ciebie skutki prawne lub w podobny sposób istotnie na Ciebie wpływało.{" "}
          <Placeholder>[Dostosuj, jeśli w przyszłości wdrożysz profilowanie marketingowe.]</Placeholder>
        </p>
      </Sekcja>

      <Sekcja tytul="10. Pliki cookies">
        <p>
          Szczegółowe informacje o wykorzystywanych plikach cookies i podobnych technologiach oraz o sposobie zarządzania
          zgodą znajdują się w{" "}
          <a href="/cookies" className="underline underline-offset-2 hover:text-akcent">Polityce cookies</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="11. Zmiany polityki prywatności">
        <p>
          Polityka prywatności może być aktualizowana, m.in. w związku ze zmianą przepisów lub zakresu świadczonych usług.
          Aktualna wersja jest zawsze dostępna na tej stronie, z podaną datą ostatniej aktualizacji.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
