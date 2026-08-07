import type { Metadata } from "next";
import { StronaInfo } from "@/components/StronaInfo";
import { NoweHaslo } from "@/components/konto/NoweHaslo";

export const metadata: Metadata = { title: "Nowe hasło", robots: { index: false, follow: true } };

export default function StronaNowegoHasla() {
  return (
    <StronaInfo tytul="Ustaw nowe hasło">
      <NoweHaslo />
    </StronaInfo>
  );
}
