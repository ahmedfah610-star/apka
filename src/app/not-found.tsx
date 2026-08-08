import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";

export default function NieZnaleziono() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Nawigacja />
      <main className="mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center px-6 py-20 text-center md:py-28">
        <p className="text-[64px] font-bold leading-none tracking-tight text-akcent md:text-[88px]">404</p>
        <h1 className="mt-4 text-[24px] font-bold tracking-tight md:text-[30px]">Nie znaleziono strony</h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
          Ups! Ta strona nie istnieje albo została przeniesiona. Może znajdziesz coś dla swojego malucha wśród naszych ubranek.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/produkty"
            className="rounded-lg bg-ink px-7 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
          >
            PRZEGLĄDAJ PRODUKTY
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-linia-2 px-7 py-3.5 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:border-ink"
          >
            STRONA GŁÓWNA
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
          <Link href="/produkty?kategoria=dziewczynki" className="underline underline-offset-2 hover:text-akcent">Dziewczynki</Link>
          <Link href="/produkty?kategoria=chlopcy" className="underline underline-offset-2 hover:text-akcent">Chłopcy</Link>
          <Link href="/produkty?kategoria=niemowleta" className="underline underline-offset-2 hover:text-akcent">Niemowlęta</Link>
          <Link href="/status-zamowienia" className="underline underline-offset-2 hover:text-akcent">Śledzenie zamówienia</Link>
          <Link href="/kontakt" className="underline underline-offset-2 hover:text-akcent">Kontakt</Link>
        </div>
      </main>
      <Stopka />
    </div>
  );
}
