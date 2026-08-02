"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function Szukajka({ mobilna = false }: { mobilna?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  // Prefill z adresu (bez useSearchParams, żeby nie wymuszać Suspense na całej nawigacji).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("szukaj") ?? "");
  }, []);

  function szukaj(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/produkty?szukaj=${encodeURIComponent(v)}` : "/produkty");
  }

  return (
    <form
      onSubmit={szukaj}
      className={`flex items-center border border-linia-2 bg-white transition-colors focus-within:border-ink ${mobilna ? "w-full" : "w-full max-w-xs"}`}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Czego szukasz? np. niemowlę bluza"
        aria-label="Szukaj produktów"
        className="w-full bg-transparent px-3 py-2 text-[13.5px] outline-none placeholder:text-ink-2"
      />
      <button type="submit" aria-label="Szukaj" className="px-2.5 text-ink-2 hover:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </button>
    </form>
  );
}
