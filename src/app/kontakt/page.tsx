import { StronaInfo, Sekcja, DaneSprzedawcy } from "@/components/StronaInfo";
import { FormularzKontaktowy } from "@/components/FormularzKontaktowy";

export const metadata = { title: "Kontakt" };

export default function Kontakt() {
  return (
    <StronaInfo tytul="Kontakt" wstep="Masz pytanie o produkt, zamówienie lub zwrot? Chętnie pomożemy — odpowiadamy zwykle w ciągu jednego dnia roboczego.">
      <Sekcja tytul="Napisz do nas">
        <FormularzKontaktowy />
        <p className="mt-3 text-[14px] text-ink-2">
          Możesz też napisać bezpośrednio na{" "}
          <a href="mailto:amin.kids1@hotmail.com" className="underline underline-offset-2 hover:text-akcent">amin.kids1@hotmail.com</a>.
          Najszybciej pomożemy, gdy podasz numer zamówienia i krótki opis sprawy.
        </p>
      </Sekcja>

      <Sekcja tytul="Sprawdź status zamówienia">
        <p>
          Chcesz wiedzieć, gdzie jest Twoja paczka? Sprawdź to na stronie{" "}
          <a href="/status-zamowienia" className="underline underline-offset-2 hover:text-akcent">Status zamówienia</a>{" "}
          — wystarczy numer zamówienia i e-mail.
        </p>
      </Sekcja>

      <Sekcja tytul="Dane sprzedawcy">
        <DaneSprzedawcy />
      </Sekcja>

      <Sekcja tytul="Zwroty i reklamacje">
        <p>
          Zasady, terminy oraz wzór formularza odstąpienia znajdziesz na stronie{" "}
          <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>.
          Adres do zwrotów: AMIN.KIDS Sp. z o.o., ul. Tomasza Zana 43/2.1, 20-601 Lublin.
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
