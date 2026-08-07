import type { Metadata } from "next";
import { BramkaZamowienia } from "@/components/konto/BramkaZamowienia";

export const metadata: Metadata = { title: "Zamówienie — logowanie", robots: { index: false, follow: true } };

export default function StronaBramkiZamowienia() {
  return <BramkaZamowienia />;
}
