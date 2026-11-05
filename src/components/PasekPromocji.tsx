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

const STREFA = "Europe/Warsaw";
const dzienPl = (t: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: STREFA }).format(t);

/** „tylko dziś do 23:59", „do jutra 23:59" albo „do sob. 7.11, 23:59" (czas polski). */
export function doKiedy(koniec: number, teraz: number): string {
  const godz = new Intl.DateTimeFormat("pl-PL", { timeZone: STREFA, hour: "2-digit", minute: "2-digit" }).format(koniec);
  if (dzienPl(koniec) === dzienPl(teraz)) return `tylko dziś do ${godz}`;
  if (dzienPl(koniec) === dzienPl(teraz + 86400000)) return `do jutra ${godz}`;
  const tydz = new Intl.DateTimeFormat("pl-PL", { timeZone: STREFA, weekday: "short" }).format(koniec);
  const data = new Intl.DateTimeFormat("pl-PL", { timeZone: STREFA, day: "numeric", month: "numeric" }).format(koniec);
  return `do ${tydz.replace(/\.?$/, ".")} ${data}, ${godz}`;
}

// Pomarańczowy pasek promocji (kolor cen = okazja) z kodem do skopiowania i odliczaniem do końca
// (lib/promocja). Liczony w przeglądarce, więc znika sam po końcu, także na stronach z cache.
// Na czas promocji chowa zielony pasek informacyjny strony głównej (html[data-promocja]). Bez panelu admina.
export function PasekPromocji() {
  const panel = (usePathname() ?? "").startsWith("/admin");
  const [teraz, setTeraz] = useState<number | null>(null);
  const [skopiowano, setSkopiowano] = useState(false);

  useEffect(() => {
    setTeraz(Date.now());
    const t = setInterval(() => setTeraz(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const widoczny = !panel && !!PROMOCJA && teraz !== null && stanPromocji(PROMOCJA, teraz) === "trwa";

  useEffect(() => {
    const html = document.documentElement;
    if (widoczny) html.dataset.promocja = "1";
    else delete html.dataset.promocja;
    return () => {
      delete html.dataset.promocja;
    };
  }, [widoczny]);

  if (!widoczny || !PROMOCJA || teraz === null) return null;

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
    <div className="bg-cena text-white" role="region" aria-label="Promocja">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-3 py-2 text-center text-[13px] font-bold leading-snug md:text-[14px]">
        <span className="hidden rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold tracking-[.08em] text-cena sm:inline">PROMOCJA</span>
        <span>
          −{PROMOCJA.procent}% na zakupy od {PROMOCJA.minKoszyk} zł<span className="hidden md:inline"> (bez dostawy)</span> z kodem{" "}
          <button
            onClick={() => void kopiuj()}
            className="ml-0.5 rounded-md border-[1.5px] border-dashed border-white bg-white/10 px-2 py-0.5 font-extrabold tracking-wide hover:bg-white/20"
            title="Kliknij, aby skopiować kod"
          >
            {skopiowano ? "skopiowano ✓" : PROMOCJA.kod}
          </button>
        </span>
        <span className="whitespace-nowrap font-semibold">
          {doKiedy(koniec, teraz)} · <span className="font-extrabold tabular-nums">{pozostalo(koniec - teraz)}</span>
        </span>
      </div>
    </div>
  );
}
