"use client";

import { useEffect, useState } from "react";
import { PROMOCJA, stanPromocji, zakresPromocji } from "@/lib/promocja";
import { doKiedy } from "@/components/PasekPromocji";

const dwa = (n: number) => String(n).padStart(2, "0");

// Duży baner promocji na stronie głównej (nad hitem tygodnia). Liczony w przeglądarce, więc znika
// sam po końcu promocji, także na stronie z cache.
export function BanerPromocji() {
  const [teraz, setTeraz] = useState<number | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);

  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!PROMOCJA || teraz === null || stanPromocji(PROMOCJA, teraz) !== "trwa") return null;
  const p = PROMOCJA;
  const koniec = new Date(p.do).getTime();
  const s = Math.max(0, Math.floor((koniec - teraz) / 1000));
  const d = Math.floor(s / 86400);
  const licznik = `${d > 0 ? `${d} d ` : ""}${dwa(Math.floor((s % 86400) / 3600))}:${dwa(Math.floor((s % 3600) / 60))}:${dwa(s % 60)}`;

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
        <span className="text-ink-2">
          <span className="hidden sm:inline"> · {p.minKoszyk > 0 ? `od ${p.minKoszyk} zł` : "bez minimum"}, dostawa bez rabatu</span>
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          {doKiedy(koniec, teraz).replace(/^tylko /, "")} <span className="font-semibold tabular-nums text-ink">({licznik})</span>
        </span>
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
