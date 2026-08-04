import { StronaInfo, Sekcja, Lista, Placeholder, DaneSprzedawcy } from "@/components/StronaInfo";

export const metadata = { title: "O nas" };

export default function ONas() {
  return (
    <StronaInfo tytul="O nas" wstep="Fasolka to sklep z ubrankami dla dzieci w wieku 0–12 lat. Wybieramy rzeczy miękkie, bezpieczne i wygodne — takie, w których dzieci mogą swobodnie się bawić, a rodzice mają pewność jakości.">
      <p>
        Wiemy, jak szybko rosną dzieci i jak wiele dzieje się w ciągu dnia — dlatego stawiamy na ubranka, które wytrzymują
        zabawę, pranie i codzienne przygody. Kompletujemy asortyment od wyprawki dla noworodka po ubrania dla starszaków
        gotowych na przedszkole i szkołę.
      </p>

      <Sekcja tytul="Co dla nas ważne">
        <Lista
          punkty={[
            "Bezpieczne, przyjazne skórze tkaniny — miękkie i oddychające.",
            "Solidne wykończenie, które znosi wielokrotne pranie i noszenie.",
            "Wygoda dziecka i swoboda ruchu na pierwszym miejscu.",
            "Uczciwe ceny i przejrzyste zasady zakupów.",
            "Szybka i wygodna wysyłka InPost.",
          ]}
        />
      </Sekcja>

      <Sekcja tytul="Nasza historia">
        <p>
          <Placeholder>[Tu opisz krótko historię marki — kiedy powstała, dlaczego, co Was wyróżnia i kto za nią stoi.
          Kilka zdań w naturalnym, ciepłym tonie zbuduje zaufanie klientów.]</Placeholder>
        </p>
      </Sekcja>

      <Sekcja tytul="Jak kupować i zwracać">
        <p>
          Zakupy zrobisz bez zakładania konta, a płatność zrealizujesz szybko przez BLIK, kartę lub Przelewy24. Masz 14 dni
          na zwrot bez podania przyczyny — szczegóły znajdziesz na stronie{" "}
          <a href="/dostawa-i-zwroty" className="underline underline-offset-2 hover:text-akcent">Dostawa i zwroty</a>.
        </p>
      </Sekcja>

      <Sekcja tytul="Dane firmy">
        <DaneSprzedawcy />
      </Sekcja>
    </StronaInfo>
  );
}
