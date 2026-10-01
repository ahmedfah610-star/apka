import type { Metadata } from "next";
import { LogowanieEdycji } from "@/components/LogowanieEdycji";

// Szybkie wejście do edycji sklepu: hasło → od razu sklep w trybie admina (bez panelu).
export const metadata: Metadata = {
  title: "Edycja sklepu",
  robots: { index: false, follow: false },
};

export default function Admin2() {
  return <LogowanieEdycji />;
}
