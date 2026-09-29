import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";

export const metadata = { title: "Dziękujemy za zamówienie" };

export default function StronaDziekujemy({ searchParams }: { searchParams: { zamowienie?: string } }) {
  const nr = searchParams.zamowienie ? searchParams.zamowienie.slice(0, 8) : null;
  return (
    <div className="overflow-x-clip">
      <Nawigacja />
      <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(66%_0.13_150)] text-2xl text-tlo">✓</div>
        <h1 className="mb-3 text-[30px] font-extrabold tracking-tight md:text-[34px]">Dziękujemy za zamówienie!</h1>
        {nr ? (
          <p className="mb-2 text-[14px] text-ink-2">
            Numer zamówienia: <strong className="text-ink">#{nr}</strong>
          </p>
        ) : null}
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
          Potwierdzenie wyślemy na Twój e-mail. Zajmiemy się kompletowaniem paczki i damy znać, gdy ruszy w drogę.
        </p>
        <Link
          href="/produkty"
          className="rounded-lg inline-block bg-ink px-8 py-3.5 text-[14.5px] font-bold text-white no-underline transition-colors hover:bg-akcent"
        >
          Wróć do sklepu
        </Link>
      </div>
      <Stopka />
    </div>
  );
}
