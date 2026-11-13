"use client";

import { useEffect, useState } from "react";
import { PROMOCJA, stanPromocji, zakresPromocji } from "@/lib/promocja";
import { doKiedy } from "@/components/PasekPromocji";

// Krótki baner promocji na stronie głównej (nad hitem tygodnia): ile, kod, do kiedy. Liczony w przeglądarce, więc znika
// sam po końcu promocji, także na stronie z cache.
export function BanerPromocji() {
  const [teraz, setTeraz] = useState<number | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);

  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!PROMOCJA || teraz === null || stanPromocji(PROMOCJA, teraz) !== "trwa") return null;
  const p = PROMOCJA;
  const koniec = p.do ? new Date(p.do).getTime() : null;

  const kopiuj = async () => {
    try {
      await navigator.clipboard.writeText(p.kod);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  };

  // Subtelnie: jasna, smukła ramka (pomarańczowy pasek u góry strony już krzyczy).
  return (
    <section
      aria-label="Promocja"
      className="mb-2.5 flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-dashed border-cena/50 bg-[oklch(97.5%_0.02_55)] px-4 py-2.5 md:mb-4 md:px-6 md:py-3"
    >
      <p className="min-w-0 text-[13.5px] leading-snug text-ink md:text-[15px]">
        <span className="font-extrabold text-cena">
          🎁 −{p.procent}% {zakresPromocji(p)}
        </span>{" "}
        z kodem <strong className="tracking-wide">{p.kod}</strong>
        {koniec !== null ? (
          <>
            <br className="sm:hidden" />
            <span className="hidden text-ink-2 sm:inline"> · </span>
            <span className="text-ink-2">{doKiedy(koniec, teraz).replace(/^tylko /, "").replace(/, 23:59$/, "")}</span>
          </>
        ) : null}
      </p>
      <button
        type="button"
        onClick={() => void kopiuj()}
        className="shrink-0 rounded-lg bg-cena px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90 md:px-4 md:py-2 md:text-[13.5px]"
      >
        {skopiowano ? "Skopiowano ✓" : "Kopiuj kod"}
      </button>
    </section>
  );
}
