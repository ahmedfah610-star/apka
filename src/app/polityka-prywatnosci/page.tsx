import { StronaInfo, Sekcja, Lista, Placeholder } from "@/components/StronaInfo";

export const metadata = { title: "Polityka prywatności — Fasolka" };

export default function PolitykaPrywatnosci() {
  return (
    <StronaInfo
      tytul="Polityka prywatności"
      wstep="Informacje o przetwarzaniu danych osobowych zgodnie z RODO. Szablon — uzupełnij dane i zweryfikuj z prawnikiem/IOD."
      aktualizacja="[DATA]"
    >
      <Sekcja tytul="1. Administrator danych">
        <p>
          Administratorem danych osobowych jest <Placeholder>[NAZWA FIRMY]</Placeholder>, <Placeholder>[ADRES]</Placeholder>,
          NIP <Placeholder>[NIP]</Placeholder>. Kontakt w sprawach danych: <Placeholder>[EMAIL]</Placeholder>.
          <Placeholder>[Jeśli powołano — Inspektor Ochrony Danych: dane kontaktowe]</Placeholder>.
        </p>
      </Sekcja>

      <Sekcja tytul="2. Jakie dane przetwarzamy">
        <Lista
          punkty={[
            "Dane zamówienia: imię i nazwisko, adres dostawy/paczkomat, e-mail, telefon.",
            "Dane rozliczeniowe (obsługiwane przez operatora płatności).",
            "Adres e-mail (newsletter, powiadomienia o dostępności).",
            "Dane techniczne: adres IP, pliki cookies (patrz Polityka cookies).",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="3. Cele i podstawy prawne (art. 6 RODO)">
        <Lista
          punkty={[
            "Realizacja zamówienia i umowy sprzedaży — art. 6 ust. 1 lit. b RODO.",
            "Obowiązki podatkowe i rachunkowe — art. 6 ust. 1 lit. c RODO.",
            "Newsletter i powiadomienia — zgoda, art. 6 ust. 1 lit. a RODO.",
            "Obsługa reklamacji i dochodzenie roszczeń — prawnie uzasadniony interes, art. 6 ust. 1 lit. f RODO.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="4. Odbiorcy danych">
        <p>Dane mogą być powierzane zaufanym podmiotom przetwarzającym w zakresie niezbędnym do realizacji usług, m.in.:</p>
        <Lista
          punkty={[
            "operator płatności (np. Stripe / Przelewy24) — obsługa płatności,",
            "firma kurierska / InPost — realizacja dostawy,",
            "dostawca hostingu i bazy danych (np. Vercel, Supabase),",
            "dostawca usługi e-mail (np. Resend) — wysyłka wiadomości transakcyjnych,",
            <Placeholder key="p">[inne — np. biuro rachunkowe]</Placeholder>,
          ]}
        />
      </Sekcja>

      <Sekcja tytul="5. Przekazywanie poza EOG">
        <p>
          Niektórzy dostawcy mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym. W takim przypadku odbywa się to
          na podstawie odpowiednich zabezpieczeń, np. standardowych klauzul umownych zatwierdzonych przez Komisję Europejską.
        </p>
      </Sekcja>

      <Sekcja tytul="6. Okres przechowywania">
        <p>
          Dane zamówień przechowujemy przez okres wymagany przepisami (m.in. podatkowymi, zwykle 5 lat) oraz przez czas
          niezbędny do dochodzenia roszczeń. Dane przetwarzane na podstawie zgody — do czasu jej wycofania.
        </p>
      </Sekcja>

      <Sekcja tytul="7. Twoje prawa">
        <p>
          Masz prawo do: dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych,
          wniesienia sprzeciwu oraz wycofania zgody w dowolnym momencie. Przysługuje Ci również prawo wniesienia skargi do
          Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).
        </p>
      </Sekcja>

      <Sekcja tytul="8. Dobrowolność i profilowanie">
        <p>
          Podanie danych jest dobrowolne, ale niezbędne do zawarcia i realizacji umowy. Nie podejmujemy decyzji opartych
          wyłącznie na zautomatyzowanym przetwarzaniu wywołujących skutki prawne <Placeholder>[dostosuj, jeśli używasz profilowania marketingowego]</Placeholder>.
        </p>
      </Sekcja>

      <Sekcja tytul="9. Pliki cookies">
        <p>
          Szczegóły dotyczące plików cookies znajdują się w{" "}
          <a href="/cookies" className="underline underline-offset-2 hover:text-akcent">Polityce cookies</a>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
