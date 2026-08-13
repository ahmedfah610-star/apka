import type { Metadata } from "next";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { PotwierdzenieMaila } from "@/components/konto/PotwierdzenieMaila";

export const metadata: Metadata = { title: "Potwierdzenie e-maila", robots: { index: false, follow: false } };

export default function StronaPotwierdzenia() {
  return (
    <UkladKonta waskie>
      <PotwierdzenieMaila />
    </UkladKonta>
  );
}
