import { StronaInfo, Sekcja, DaneSprzedawcy } from "@/components/StronaInfo";
import { FormularzKontaktowy } from "@/components/FormularzKontaktowy";

export const metadata = { title: "Kontakt" };

export default function Kontakt() {
  return (
    <StronaInfo tytul="Kontakt" wstep="Masz pytanie o produkt, zamówienie lub zwrot? Chętnie pomożemy — odpowiadamy zwykle w ciągu jednego dnia roboczego.">
      <Sekcja tytul="Kontakt bezpośredni">
        <div className="rounded-xl border border-linia bg-szary/30 p-4 sm:p-5">
          <p className="text-[15px] text-ink">
            <strong>Telefon:</strong>{" "}
            <a href="tel:+48793878222" className="font-semibold underline underline-offset-2 hover:text-akcent">+48 793 878 222</a>
          </p>
          <p className="mt-1.5 text-[15px] text-ink">
            <strong>E-mail:</strong>{" "}
            <a href="mailto:amin.kids1@hotmail.com" className="underline underline-offset-2 hover:text-akcent">amin.kids1@hotmail.com</a>
          </p>
          <p className="mt-2 text-[13px] text-ink-2">Odpowiadamy zwykle w ciągu jednego dnia roboczego (pon.–pt.).</p>
        </div>
      </Sekcja>

      <Sekcja tytul="Napisz do nas">
        <FormularzKontaktowy />
        <p className="mt-3 text-[14px] text-ink-2">
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
