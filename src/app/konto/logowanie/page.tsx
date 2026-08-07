import type { Metadata } from "next";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { FormularzKonta } from "@/components/konto/FormularzKonta";

export const metadata: Metadata = { title: "Logowanie", robots: { index: false, follow: true } };

export default function StronaLogowania() {
  return (
    <UkladKonta waskie>
      <FormularzKonta />
    </UkladKonta>
  );
}
