"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export function IkonaKonta() {
  const { user, wlaczone } = useAuth();
  if (!wlaczone) return null;
  return (
    <Link
      href={user ? "/konto" : "/konto/logowanie"}
      aria-label={user ? "Moje konto" : "Zaloguj się"}
      className="relative flex items-center text-ink no-underline transition-colors hover:text-akcent"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </Link>
  );
}
