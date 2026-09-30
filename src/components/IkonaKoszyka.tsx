"use client";

import Link from "next/link";
import { useKoszyk } from "@/components/KoszykContext";

export function IkonaKoszyka() {
  const { liczbaSztuk } = useKoszyk();
  return (
    <Link href="/koszyk" aria-label="Koszyk" className="relative flex h-10 w-10 items-center justify-center text-ink no-underline transition-colors hover:text-akcent">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {liczbaSztuk > 0 ? (
        <span className="absolute right-0 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-akcent px-1 text-[10.5px] font-bold leading-none text-white ring-2 ring-white">
          {liczbaSztuk}
        </span>
      ) : null}
    </Link>
  );
}
