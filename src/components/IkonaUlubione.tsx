"use client";

import Link from "next/link";
import { useUlubione } from "@/components/UlubioneContext";

export function IkonaUlubione() {
  const { liczba } = useUlubione();
  return (
    <Link href="/ulubione" aria-label="Ulubione" className="relative text-ink no-underline">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 21s-7.5-4.9-9.7-9.2C.9 8.9 2.3 5.5 5.5 5.1c1.9-.2 3.4.8 4.5 2.3 1.1-1.5 2.6-2.5 4.5-2.3 3.2.4 4.6 3.8 3.2 6.7C19.5 16.1 12 21 12 21Z" />
      </svg>
      {liczba > 0 ? (
        <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center bg-akcent px-1 text-[11px] font-semibold leading-none text-tlo">
          {liczba}
        </span>
      ) : null}
    </Link>
  );
}
