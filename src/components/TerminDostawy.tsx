"use client";

import { useEffect, useState } from "react";
import { szacowanaDostawa } from "@/lib/dostawaTermin";

// Szacowany termin dostawy. Liczony po stronie klienta (po zamontowaniu),
// aby uniknąć rozjazdu SSR/CSR na przełomie dnia.
export function TerminDostawy({ klasa }: { klasa?: string }) {
  const [tekst, setTekst] = useState<string | null>(null);
  useEffect(() => {
    setTekst(szacowanaDostawa().tekst);
  }, []);
  if (!tekst) return null;
  return (
    <p className={klasa ?? "flex items-center gap-2 text-[13.5px] text-ink-2"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M10 17h4V5H2v12h3" /><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
      <span>Przewidywana dostawa: <strong className="font-semibold text-ink">{tekst}</strong></span>
    </p>
  );
}
