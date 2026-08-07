import type { Metadata } from "next";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { NoweHaslo } from "@/components/konto/NoweHaslo";

export const metadata: Metadata = { title: "Nowe hasło", robots: { index: false, follow: true } };

export default function StronaNowegoHasla() {
  return (
    <UkladKonta waskie>
      <NoweHaslo />
    </UkladKonta>
  );
}
