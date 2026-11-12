import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { SledzenieZamowienia } from "@/components/SledzenieZamowienia";

export const metadata: Metadata = {
  title: "Sprawdź status zamówienia",
  description: "Gdzie jest moja paczka? Podaj numer zamówienia i e-mail, a od razu zobaczysz, na jakim etapie jest Twoje zamówienie.",
  alternates: { canonical: "/status-zamowienia" },
  robots: { index: false, follow: true },
};

export default function StronaStatusu() {
  return (
    <StronaInfo tytul="Status zamówienia" wstep="Podaj numer zamówienia i e-mail, którego użyłeś przy zakupie, aby sprawdzić, na jakim etapie jest Twoja paczka.">
      <SledzenieZamowienia />
    </StronaInfo>
  );
}
