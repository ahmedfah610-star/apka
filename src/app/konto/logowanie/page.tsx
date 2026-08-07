import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { FormularzKonta } from "@/components/konto/FormularzKonta";

export const metadata: Metadata = { title: "Logowanie", robots: { index: false, follow: true } };

export default function StronaLogowania() {
  return (
    <StronaInfo tytul="Zaloguj się" wstep="Zaloguj się lub załóż konto, aby mieć historię zamówień i zapisany koszyk na każdym urządzeniu.">
      <FormularzKonta />
    </StronaInfo>
  );
}
