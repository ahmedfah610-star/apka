import { StronaInfo, Sekcja, Lista, DaneSprzedawcy } from "@/components/StronaInfo";

export const metadata = { title: "O nas" };

const ALLEGRO = "https://allegro.pl/uzytkownik/bobas-shopping/oceny";

export default function ONas() {
  return (
    <StronaInfo
      tytul="O nas"
      wstep="bobas-shopping to sklep internetowy z ubrankami dla dzieci w wieku 0–12 lat i odzieżą męską. Sklep prowadzi AMIN.KIDS Sp. z o.o. z siedzibą w Lublinie."
    >
      <Sekcja tytul="Kim jesteśmy">
        <p>
          Jesteśmy polską firmą — AMIN.KIDS Sp. z o.o. (KRS 0000984936, NIP 7123438950), ul. Tomasza Zana 43/2.1, 20-601
          Lublin. Sprzedajemy ubranka od wyprawki dla noworodka po rzeczy dla starszaków do przedszkola i szkoły, a także
          męskie bluzy, swetry i dresy. Przy każdym produkcie podajemy skład, wymiary dla każdego rozmiaru i zdjęcia
          rzeczywistego towaru.
        </p>
      </Sekcja>

      <Sekcja tytul="Sprzedajemy też na Allegro">
        <p>
          Pod tą samą nazwą — <strong>bobas-shopping</strong> — sprzedajemy na Allegro. To ten sam sprzedawca, ten sam
          towar i te same zasady. Oceny i komentarze naszych kupujących znajdziesz na{" "}
          <a href={ALLEGRO} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-akcent">
            profilu sprzedawcy bobas-shopping na Allegro
          </a>
          .
        </p>
      </Sekcja>

      <Sekcja tytul="Jak działamy">
        <Lista
          punkty={[
            "Płatność online przez Przelewy24 (BLIK, szybki przelew, karta) — zamówienie realizujemy po zaksięgowaniu wpłaty.",
            "Zamówienia pakujemy i nadajemy zwykle w 1–2 dni robocze od zaksięgowania płatności.",
            "Dostawa: InPost (Paczkomaty i kurier), ORLEN Paczka, DPD Pickup, Pocztex, kurier DHL. Darmowa dostawa od 150 zł.",
            "14 dni na zwrot bez podania przyczyny; bezpośredni koszt odesłania towaru ponosi kupujący.",
            "Reklamacje rozpatrujemy w ciągu 14 dni.",
            "Zakupy bez zakładania konta.",
          ]}
        />
        <p className="mt-3">
          Szczegóły: <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>,{" "}
          <a href="/regulamin" className="underline underline-offset-2 hover:text-akcent">Regulamin</a>,{" "}
          <a href="/polityka-prywatnosci" className="underline underline-offset-2 hover:text-akcent">Polityka prywatności</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="Kontakt">
        <p>
          Odpowiadamy w dni robocze (pon.–pt.), zwykle w ciągu jednego dnia. Napisz lub zadzwoń — dane poniżej oraz na
          stronie <a href="/kontakt" className="underline underline-offset-2 hover:text-akcent">Kontakt</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="Dane firmy">
        <DaneSprzedawcy />
      </Sekcja>
    </StronaInfo>
  );
}
