import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";

export const metadata = { title: "Dziękujemy za zamówienie — Fasolka" };

export default function StronaDziekujemy() {
  return (
    <div className="overflow-x-hidden">
      <Nawigacja />
      <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-akcent text-2xl text-tlo">✓</div>
        <h1 className="mb-3 text-[32px] font-bold tracking-tight">Dziękujemy za zamówienie!</h1>
        <p className="mx-auto mb-8 max-w-md text-[15px] text-ink-2">
          Potwierdzenie wyślemy na Twój e-mail. To wersja demonstracyjna sklepu — zamówienie nie zostało
          realnie złożone ani opłacone.
        </p>
        <Link
          href="/produkty"
          className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
        >
          WRÓĆ DO SKLEPU
        </Link>
      </div>
      <Stopka />
    </div>
  );
}
