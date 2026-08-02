"use client";

import Link from "next/link";
import { useKoszyk } from "@/components/KoszykContext";

export function IkonaKoszyka() {
  const { liczbaSztuk } = useKoszyk();
  return (
    <Link href="/koszyk" aria-label="Koszyk" className="relative text-ink no-underline">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 7h12l-1 13H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      {liczbaSztuk > 0 ? (
        <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center bg-akcent px-1 text-[11px] font-semibold leading-none text-tlo">
          {liczbaSztuk}
        </span>
      ) : null}
    </Link>
  );
}
