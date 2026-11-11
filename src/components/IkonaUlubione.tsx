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
      className="relative flex h-10 w-10 items-center justify-center text-ink no-underline transition-colors hover:text-akcent"
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
        <path d="M12 20.5C12 20.5 3 14.8 3 8.9 3 6.2 5.1 4.2 7.6 4.2c1.8 0 3.5 1.1 4.4 2.7.9-1.6 2.6-2.7 4.4-2.7 2.5 0 4.6 2 4.6 4.7 0 5.9-9 11.6-9 11.6Z" />
      </svg>
      {ma ? (
        <span className="absolute right-0 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-akcent px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white">
          {liczba}
        </span>
      ) : null}
    </Link>
  );
}
