"use client";

import Link from "next/link";
import { useUlubione } from "@/components/UlubioneContext";

export function IkonaUlubione() {
  const { liczba } = useUlubione();
  const ma = liczba > 0;
  return (
    <Link
      href="/ulubione"
      aria-label="Ulubione"
      className="relative flex items-center text-ink no-underline transition-colors hover:text-akcent"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={ma ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={ma ? 0 : 1.6}
        className={ma ? "text-akcent" : ""}
      >
        <path d="M12 21s-7.5-4.9-9.7-9.2C.9 8.9 2.3 5.5 5.5 5.1c1.9-.2 3.4.8 4.5 2.3 1.1-1.5 2.6-2.5 4.5-2.3 3.2.4 4.6 3.8 3.2 6.7C19.5 16.1 12 21 12 21Z" />
      </svg>
      {ma ? (
        <span className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-akcent px-1 text-[10.5px] font-bold leading-none text-tlo ring-2 ring-tlo">
          {liczba}
        </span>
      ) : null}
    </Link>
  );
}
