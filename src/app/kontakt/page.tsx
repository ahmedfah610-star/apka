import { StronaInfo, Sekcja, Placeholder, DaneSprzedawcy } from "@/components/StronaInfo";

export const metadata = { title: "Kontakt" };

export default function Kontakt() {
  return (
    <StronaInfo tytul="Kontakt" wstep="Masz pytanie o produkt, zamówienie lub zwrot? Chętnie pomożemy — odpowiadamy zwykle w ciągu jednego dnia roboczego.">
      <Sekcja tytul="Napisz lub zadzwoń">
        <p>
          E-mail: <Placeholder>[adres e-mail]</Placeholder>
          <br />
          Telefon: <Placeholder>[telefon]</Placeholder> (pon.–pt. <Placeholder>[godziny]</Placeholder>)
        </p>
        <p className="text-[14px] text-ink-2">
          Najszybciej pomożemy, gdy w wiadomości podasz numer zamówienia oraz krótki opis sprawy.
        </p>
      </Sekcja>

      <Sekcja tytul="Dane sprzedawcy">
        <DaneSprzedawcy />
      </Sekcja>

      <Sekcja tytul="Zwroty i reklamacje">
        <p>
          Zasady, terminy oraz wzór formularza odstąpienia znajdziesz na stronie{" "}
          <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>.
          Adres do zwrotów: <Placeholder>[adres do zwrotów]</Placeholder>.
        </p>
      </Sekcja>

      <Sekcja tytul="Częste pytania">
        <p>
          Zanim napiszesz, sprawdź stronę{" "}
          <a href="/faq" className="underline underline-offset-2 hover:text-akcent">FAQ</a> — być może odpowiedź na Twoje
          pytanie jest już tam dostępna.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
