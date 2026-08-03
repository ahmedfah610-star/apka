import { StronaInfo, Sekcja, Placeholder } from "@/components/StronaInfo";

export const metadata = { title: "Kontakt — Fasolka" };

export default function Kontakt() {
  return (
    <StronaInfo tytul="Kontakt" wstep="Chętnie pomożemy — napisz lub zadzwoń.">
      <Sekcja tytul="Dane kontaktowe">
        <p>
          E-mail: <Placeholder>[EMAIL]</Placeholder>
          <br />
          Telefon: <Placeholder>[TELEFON]</Placeholder> (pon.–pt. <Placeholder>[GODZINY]</Placeholder>)
        </p>
      </Sekcja>
      <Sekcja tytul="Adres">
        <p>
          <Placeholder>[NAZWA FIRMY]</Placeholder>
          <br />
          <Placeholder>[ULICA I NUMER]</Placeholder>
          <br />
          <Placeholder>[KOD POCZTOWY, MIEJSCOWOŚĆ]</Placeholder>
        </p>
      </Sekcja>
      <Sekcja tytul="Dane rejestrowe">
        <p>
          NIP: <Placeholder>[NIP]</Placeholder> · REGON: <Placeholder>[REGON]</Placeholder>
        </p>
      </Sekcja>
      <Sekcja tytul="Zwroty i reklamacje">
        <p>
          Formularze i zasady znajdziesz na stronie <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>.
          Adres do zwrotów: <Placeholder>[ADRES DO ZWROTÓW]</Placeholder>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
