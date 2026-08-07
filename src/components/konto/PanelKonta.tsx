"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

const KATEGORIE = [
  { href: "/produkty", label: "Wszystkie produkty" },
  { href: "/produkty?kategoria=dziewczynki", label: "Dziewczynki" },
  { href: "/produkty?kategoria=chlopcy", label: "Chłopcy" },
  { href: "/produkty?kategoria=niemowleta", label: "Niemowlęta" },
];

export function PanelKonta() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, wyloguj } = useAuth();

  useEffect(() => {
    if (zaladowano && wlaczone && !user) router.replace("/konto/logowanie");
  }, [zaladowano, wlaczone, user, router]);

  if (!wlaczone) return <p className="text-center text-[15px] text-ink-2">Konto jest chwilowo niedostępne.</p>;
  if (!zaladowano || !user) return <p className="text-center text-[15px] text-ink-2">Ładowanie…</p>;

  const imie = (user.user_metadata?.imie as string | undefined)?.trim();
  const kafel = "group flex items-start gap-4 rounded-xl border border-linia bg-white p-5 text-inherit no-underline transition-all hover:border-ink hover:shadow-[0_4px_20px_-14px_rgba(0,0,0,0.4)]";

  return (
    <div className="w-full">
      {/* Nagłówek */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight md:text-[31px]">
            Cześć{imie ? `, ${imie}` : ""}! 👋
          </h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Zalogowano jako <strong className="font-semibold text-ink">{user.email}</strong>
          </p>
        </div>
        <button
          onClick={() => {
            void wyloguj();
            router.replace("/");
          }}
          className="rounded-lg border border-linia-2 px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          Wyloguj się
        </button>
      </div>

      {/* Skróty konta */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/konto/zamowienia" className={kafel}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-szary/70 text-ink transition-colors group-hover:bg-akcent group-hover:text-tlo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2 4 6v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6l-2-4H6Z" />
              <path d="M4 6h16M10 10a2 2 0 0 0 4 0" />
            </svg>
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Moje zamówienia</span>
            <span className="mt-0.5 block text-[13px] text-ink-2">Historia i status zamówień</span>
          </span>
        </Link>
        <Link href="/ulubione" className={kafel}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-szary/70 text-ink transition-colors group-hover:bg-akcent group-hover:text-tlo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
            </svg>
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Ulubione</span>
            <span className="mt-0.5 block text-[13px] text-ink-2">Zapisane produkty</span>
          </span>
        </Link>
      </div>

      {/* Przeglądaj sklep */}
      <h2 className="mb-3 mt-10 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Przeglądaj sklep</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KATEGORIE.map((k) => (
          <Link
            key={k.href}
            href={k.href}
            className="rounded-xl border border-linia bg-white px-4 py-4 text-center text-[14px] font-semibold text-ink no-underline transition-all hover:border-ink hover:bg-szary/30"
          >
            {k.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-linia-2 bg-white/60 p-5 text-center">
        <p className="text-[14px] text-ink-2">Gotowy na zakupy?</p>
        <Link
          href="/produkty"
          className="mt-3 inline-block rounded-lg bg-ink px-7 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
        >
          PRZEGLĄDAJ PRODUKTY
        </Link>
      </div>
    </div>
  );
}
