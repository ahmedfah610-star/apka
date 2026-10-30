import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { ZglosZakup } from "@/components/ZglosZakup";
import { StatusPlatnosci } from "@/components/StatusPlatnosci";

export const metadata = { title: "Dziękujemy za zamówienie" };

export default function StronaDziekujemy({ searchParams }: { searchParams: { zamowienie?: string } }) {
  return (
    <div className="overflow-x-clip">
      <Nawigacja />
      {searchParams.zamowienie ? <ZglosZakup id={searchParams.zamowienie} /> : null}
      <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
        {searchParams.zamowienie ? (
          <StatusPlatnosci id={searchParams.zamowienie} />
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(66%_0.13_150)] text-2xl text-tlo">✓</div>
            <h1 className="mb-3 text-[30px] font-extrabold tracking-tight md:text-[34px]">Dziękujemy za zamówienie!</h1>
            <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
              Potwierdzenie wyślemy na Twój e-mail. Zajmiemy się kompletowaniem paczki i damy znać, gdy ruszy w drogę.
            </p>
          </>
        )}
        <Link
          href="/produkty"
          className="rounded-lg inline-block border border-ink px-8 py-3.5 text-[14.5px] font-bold text-ink no-underline transition-colors hover:bg-ink hover:text-white"
        >
          Wróć do sklepu
        </Link>
      </div>
      <Stopka />
    </div>
  );
}
