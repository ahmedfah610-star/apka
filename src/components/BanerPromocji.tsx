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
  const licznik = [
    { n: Math.floor(s / 86400), j: "dni" },
    { n: Math.floor((s % 86400) / 3600), j: "godz." },
    { n: Math.floor((s % 3600) / 60), j: "min" },
    { n: s % 60, j: "sek." },
  ];

  const kopiuj = async () => {
    try {
      await navigator.clipboard.writeText(p.kod);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  };

  return (
    <section
      aria-label="Promocja"
      className="mb-2.5 flex flex-col gap-4 overflow-hidden rounded-2xl bg-cena px-5 py-5 text-white md:mb-4 md:flex-row md:items-center md:justify-between md:gap-8 md:px-10 md:py-7"
    >
      <div>
        <p className="mb-1 text-[12px] font-extrabold uppercase tracking-[.12em] text-white/85 md:text-[13px]">Zimowa promocja</p>
        <p className="text-[34px] font-extrabold leading-none tracking-tight md:text-[52px]">
          −{p.procent}% {zakresPromocji(p)}
        </p>
        <p className="mt-2 text-[13.5px] font-semibold text-white/90 md:text-[15px]">
          {p.minKoszyk > 0 ? `Przy zakupach od ${p.minKoszyk} zł` : "Bez minimalnej kwoty"} · rabat od produktów, dostawa bez rabatu · ważny{" "}
          {doKiedy(koniec, teraz).replace(/^tylko /, "")}
        </p>
      </div>
      <div className="flex flex-col gap-3 md:items-end">
        <button
          type="button"
          onClick={() => void kopiuj()}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-white bg-white/10 px-4 py-2.5 text-left transition-colors hover:bg-white/20 md:min-w-[260px]"
          title="Kliknij, aby skopiować kod"
        >
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-[.1em] text-white/80">Kod rabatowy</span>
            <span className="block text-[24px] font-extrabold tracking-[.06em] md:text-[28px]">{p.kod}</span>
          </span>
          <span className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold text-cena">{skopiowano ? "Skopiowano ✓" : "Kopiuj"}</span>
        </button>
        <div className="flex gap-2 tabular-nums" aria-label="Do końca promocji">
          {licznik.map((x) => (
            <span key={x.j} className="min-w-[52px] rounded-lg bg-white/15 px-2 py-1 text-center">
              <span className="block text-[18px] font-extrabold leading-tight">{dwa(x.n)}</span>
              <span className="block text-[10.5px] font-semibold text-white/80">{x.j}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
