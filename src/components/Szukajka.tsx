"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUKTY, type Produkt } from "@/data/produkty";
import { formatCena, pasujeFraza } from "@/lib/filtrowanie";

// Katalog do podpowiedzi — współdzielony między instancjami (nav desktop + mobile).
let KATALOG_CACHE: Produkt[] | null = null;

export function Szukajka({ mobilna = false }: { mobilna?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [otwarte, setOtwarte] = useState(false);
  const [katalog, setKatalog] = useState<Produkt[]>(KATALOG_CACHE ?? PRODUKTY);
  const zamkniecie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (KATALOG_CACHE) return;
    fetch("/api/katalog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.items) && d.items.length) {
          KATALOG_CACHE = d.items;
          setKatalog(d.items);
        }
      })
      .catch(() => {});
  }, []);

  const podpowiedzi = useMemo(() => {
    const t = q.trim();
    if (t.length < 2) return [];
    return katalog.filter((p) => pasujeFraza(p, t)).slice(0, 6);
  }, [q, katalog]);

  function idzDoWynikow(fraza: string) {
    const v = fraza.trim();
    setOtwarte(false);
    router.push(v ? `/produkty?szukaj=${encodeURIComponent(v)}` : "/produkty");
  }

  return (
    <div className={`relative ${mobilna ? "w-full" : "w-full max-w-md"}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          idzDoWynikow(q);
        }}
        className="flex items-center border border-linia-2 bg-white transition-colors focus-within:border-ink"
      >
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOtwarte(true);
          }}
          onFocus={() => setOtwarte(true)}
          onBlur={() => {
            zamkniecie.current = setTimeout(() => setOtwarte(false), 150);
          }}
          placeholder={mobilna ? "Czego szukasz?" : "Czego szukasz? np. niemowlę bluza"}
          aria-label="Szukaj produktów"
          enterKeyHint="search"
          className="w-full bg-transparent px-3.5 py-2.5 text-[16px] outline-none placeholder:text-ink-2 md:text-[13.5px]"
        />
        <button type="submit" aria-label="Szukaj" className="flex items-center gap-1 bg-ink px-3.5 py-2.5 text-tlo transition-colors hover:bg-akcent">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </button>
      </form>

      {otwarte && podpowiedzi.length > 0 ? (
        <div
          className="absolute left-0 right-0 top-full z-[60] mt-1 border border-linia bg-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
          onMouseDown={() => {
            if (zamkniecie.current) clearTimeout(zamkniecie.current);
          }}
        >
          {podpowiedzi.map((p) => (
            <Link
              key={p.id}
              href={`/produkty/${p.id}`}
              onClick={() => setOtwarte(false)}
              className="flex items-center gap-3 border-b border-linia px-3 py-2 text-inherit no-underline transition-colors last:border-b-0 hover:bg-szary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-szary">
                {p.zdjecie ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.zdjecie} alt="" className="h-full w-full object-contain p-0.5" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{p.nazwa}</span>
                <span className="block text-[12px] text-ink-2">{formatCena(p.cena)} zł</span>
              </span>
            </Link>
          ))}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => idzDoWynikow(q)}
            className="block w-full bg-szary px-3 py-2.5 text-left text-[12.5px] font-semibold text-ink hover:text-akcent"
          >
            Zobacz wszystkie wyniki dla „{q.trim()}" →
          </button>
        </div>
      ) : null}
    </div>
  );
}
