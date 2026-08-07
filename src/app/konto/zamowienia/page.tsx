import type { Metadata } from "next";
import Link from "next/link";
import { UkladKonta } from "@/components/konto/UkladKonta";
import { HistoriaZamowien } from "@/components/konto/HistoriaZamowien";

export const metadata: Metadata = { title: "Moje zamówienia", robots: { index: false, follow: true } };

export default function StronaZamowienKonta() {
  return (
    <UkladKonta>
      <Link href="/konto" className="mb-4 inline-block text-[13px] text-ink-2 no-underline transition-colors hover:text-akcent">
        ← Moje konto
      </Link>
      <h1 className="text-[26px] font-bold tracking-tight md:text-[31px]">Moje zamówienia</h1>
      <p className="mb-8 mt-1 text-[14px] text-ink-2">Historia i status Twoich zamówień.</p>
      <HistoriaZamowien />
    </UkladKonta>
  );
}
