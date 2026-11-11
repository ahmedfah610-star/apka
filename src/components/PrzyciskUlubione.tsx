"use client";

import { useUlubione } from "@/components/UlubioneContext";

export function PrzyciskUlubione({ id, wariant = "karta" }: { id: string; wariant?: "karta" | "produkt" }) {
  const { czy, przelacz } = useUlubione();
  const aktywne = czy(id);

  if (wariant === "produkt") {
    return (
      <button
        type="button"
        onClick={() => przelacz(id)}
        aria-pressed={aktywne}
        aria-label={aktywne ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-[14px] font-bold transition-all sm:px-5 ${
          aktywne ? "border-akcent bg-akcent/[0.06] text-akcent" : "border-linia-2 bg-white text-ink hover:border-ink"
        }`}
      >
        <Serce pelne={aktywne} />
        <span className="hidden sm:inline">{aktywne ? "W ulubionych" : "Do ulubionych"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        przelacz(id);
      }}
      aria-label={aktywne ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-pressed={aktywne}
      className={`absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.04] backdrop-blur transition-all duration-200 hover:scale-110 hover:bg-white active:scale-90 ${
        aktywne ? "text-akcent" : "text-ink-2 hover:text-akcent"
      }`}
    >
      <Serce pelne={aktywne} />
    </button>
  );
}

function Serce({ pelne }: { pelne: boolean }) {
  return (
    <svg
      key={pelne ? "on" : "off"}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={pelne ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={pelne ? 0 : 1.8}
      className={pelne ? "heart-pop" : ""}
    >
      <path d="M12 20.5C12 20.5 3 14.8 3 8.9 3 6.2 5.1 4.2 7.6 4.2c1.8 0 3.5 1.1 4.4 2.7.9-1.6 2.6-2.7 4.4-2.7 2.5 0 4.6 2 4.6 4.7 0 5.9-9 11.6-9 11.6Z" />
    </svg>
  );
}
