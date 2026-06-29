import Link from "next/link";
import { Przycisk } from "@/components/ui";

export default function StronaGlowna() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center">
      <div className="mb-6 text-5xl">🐾</div>
      <h1 className="mb-2 text-2xl font-bold text-primary">mojaŁapa</h1>
      <p className="mb-8 text-sm text-primary/60">
        Dobieramy karmę pod Twojego pupila — porównujemy ceny w sklepach i liczymy realny
        koszt karmienia w miesiącu.
      </p>
      <Link href="/kreator" className="w-full">
        <Przycisk>Zacznij — dobierz karmę</Przycisk>
      </Link>
      <Link href="/specjalisci" className="mt-3 w-full">
        <Przycisk wariant="ghost">Ranking weterynarzy i fryzjerów</Przycisk>
      </Link>
    </main>
  );
}
