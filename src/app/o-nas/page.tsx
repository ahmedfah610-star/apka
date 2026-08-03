import { StronaInfo, Sekcja, Placeholder } from "@/components/StronaInfo";

export const metadata = { title: "O nas — Fasolka" };

export default function ONas() {
  return (
    <StronaInfo tytul="O nas" wstep="Fasolka to sklep z ubrankami dla dzieci 0–12 lat.">
      <p>
        Wybieramy ubranka miękkie, bezpieczne i wygodne — takie, w których dzieci mogą swobodnie się bawić, a rodzice
        mają pewność jakości. Stawiamy na przyjazne skórze tkaniny i solidne wykonanie.
      </p>
      <Sekcja tytul="Nasza historia">
        <p>
          <Placeholder>[Tu opisz krótko historię marki — kiedy powstała, dlaczego, co Was wyróżnia]</Placeholder>
        </p>
      </Sekcja>
      <Sekcja tytul="Co nas wyróżnia">
        <p>Miękkie i oddychające tkaniny, bezpieczne materiały, wytrzymałe wykończenie i szybka wysyłka InPost.</p>
      </Sekcja>
      <Sekcja tytul="Dane firmy">
        <p>
          Sprzedawcą jest <Placeholder>[NAZWA FIRMY]</Placeholder>, <Placeholder>[ADRES]</Placeholder>,
          NIP <Placeholder>[NIP]</Placeholder>, REGON <Placeholder>[REGON]</Placeholder>.
          Kontakt: <Placeholder>[EMAIL]</Placeholder>, tel. <Placeholder>[TELEFON]</Placeholder>.
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
