"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PROMOCJA, stanPromocji } from "@/lib/promocja";

const dwa = (n: number) => String(n).padStart(2, "0");

function pozostalo(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const g = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d > 0 ? `${d} d ` : ""}${dwa(g)}:${dwa(m)}:${dwa(s % 60)}`;
}

// Pasek promocji z odliczaniem do prawdziwego końca promocji (lib/promocja). Liczony w przeglądarce,
// więc znika sam po końcu, także na stronach z cache. Bez panelu admina.
export function PasekPromocji() {
  const panel = (usePathname() ?? "").startsWith("/admin");
  const [teraz, setTeraz] = useState<number | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);

  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (panel || !PROMOCJA || teraz === null || stanPromocji(PROMOCJA, teraz) !== "trwa") return null;

  const koniec = new Date(PROMOCJA.do).getTime();
  const kopiuj = async () => {
    try {
      await navigator.clipboard.writeText(PROMOCJA!.kod);
      setSkopiowano(true);
      setTimeout(() => setSkopiowano(false), 2000);
    } catch {
      /* ignoruj */
    }
  };

  return (
    <div className="bg-akcent text-white" role="region" aria-label="Promocja">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-2 text-center text-[13px] leading-snug md:text-[14px]">
        <span>
          <strong>−{PROMOCJA.procent}%</strong> na zakupy od {PROMOCJA.minKoszyk} zł z kodem{" "}
          <button
            onClick={() => void kopiuj()}
            className="rounded border border-dashed border-white/80 px-1.5 py-0.5 font-bold tracking-wide hover:bg-white/15"
            title="Kliknij, aby skopiować kod"
          >
            {skopiowano ? "skopiowano ✓" : PROMOCJA.kod}
          </button>
        </span>
        <span className="whitespace-nowrap">
          Koniec za <strong className="tabular-nums">{pozostalo(koniec - teraz)}</strong>
        </span>
      </div>
    </div>
  );
}
