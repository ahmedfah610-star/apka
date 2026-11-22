import Link from "next/link";
import type { OpiniaAllegro, PodsumowanieAllegro } from "@/lib/opinieAllegro";

// Opinie o sklepie z Allegro — wspólne klocki (karta produktu, strona /opinie, strona główna, zamówienie).
// Allegro nie ma gwiazdek, tylko „polecam / nie polecam” — pokazujemy dokładnie to, bez wymyślonej średniej.

export const ZRODLO_OPINII =
  "Opinie pochodzą z naszego konta sprzedawcy na Allegro, gdzie ocenić sprzedającego może tylko osoba, która u nas kupiła. Pokazujemy wszystkie opinie z treścią — także negatywne.";

const liczba = (n: number) => n.toLocaleString("pl-PL");
const ocenSlowo = (n: number) => (n === 1 ? "ocena" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "oceny" : "ocen");
const dzien = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function Kciuk({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M2 21h3V9H2v12Zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3c0-.4-.2-.8-.4-1.1L13.2 1 6.6 7.6c-.4.4-.6.9-.6 1.4v10c0 1.1.9 2 2 2h9c.8 0 1.5-.5 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2Z" />
    </svg>
  );
}

/** A: jedna linijka pod ceną / przy płatności. */
/** `href = null` — bez linku (np. w zamówieniu: nie wyprowadzamy klienta z płatności). */
export function PasekOpiniiAllegro({ p, href = "/opinie", className = "" }: { p: PodsumowanieAllegro; href?: string | null; className?: string }) {
  if (!p.procentPolecen || p.ocen <= 0) return null;
  const klasa = `flex items-center gap-2.5 rounded-xl border border-linia px-3 py-2.5 text-[13px] text-ink no-underline ${className}`;
  if (href === null) {
    return (
      <div className={klasa}>
        <Kciuk className="shrink-0 text-akcent" />
        <span className="min-w-0">
          <strong className="font-extrabold">{p.procentPolecen}% kupujących poleca</strong>
          <span className="text-ink-2">
            {" "}
            · {liczba(p.ocen)} {ocenSlowo(p.ocen)} na Allegro
          </span>
        </span>
      </div>
    );
  }
  return (
    <Link href={href} className={`${klasa} transition-colors hover:border-ink`}>
      <Kciuk className="shrink-0 text-akcent" />
      <span className="min-w-0">
        <strong className="font-extrabold">{p.procentPolecen}% kupujących poleca</strong>
        <span className="text-ink-2">
          {" "}
          · {liczba(p.ocen)} {ocenSlowo(p.ocen)} na Allegro
        </span>
      </span>
      <span className="ml-auto font-extrabold text-akcent" aria-hidden>
        ›
      </span>
    </Link>
  );
}

function JednaOpinia({ o, oTymProdukcie }: { o: OpiniaAllegro; oTymProdukcie?: boolean }) {
  return (
    <li className="border-t border-linia py-3.5 first:border-t-0">
      <div className="flex items-center justify-between gap-3 text-[12.5px] text-ink-2">
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{o.login}</span>
          {o.polecam ? (
            <span className="font-semibold text-akcent">· poleca</span>
          ) : (
            <span className="font-semibold text-red-700">· nie poleca</span>
          )}
          {oTymProdukcie ? <span className="rounded-md bg-akcent/10 px-1.5 py-0.5 text-[11px] font-bold text-akcent">ten produkt</span> : null}
        </span>
        <span className="shrink-0">{dzien(o.data)}</span>
      </div>
      <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{o.tekst}</p>
      {o.odpowiedz ? (
        <p className="mt-2 rounded-lg bg-szary px-3 py-2 text-[13px] leading-relaxed text-ink-2">
          <strong className="text-ink">Odpowiedź sklepu:</strong> {o.odpowiedz}
        </p>
      ) : null}
    </li>
  );
}

/** B: podsumowanie + lista opinii (karta produktu: kilka, strona /opinie: wszystkie). */
export function OpinieAllegroSekcja({
  podsumowanie,
  opinie,
  idProduktow = [],
  pelna = false,
}: {
  podsumowanie: PodsumowanieAllegro;
  opinie: OpiniaAllegro[];
  idProduktow?: string[];
  pelna?: boolean;
}) {
  if (!podsumowanie.procentPolecen || podsumowanie.ocen <= 0) return null;
  const ids = new Set(idProduktow);
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-[34px] font-extrabold leading-none tracking-tight md:text-[40px]">{podsumowanie.procentPolecen}%</p>
        <p className="pb-0.5 text-[14px] text-ink-2">
          kupujących poleca nas na Allegro · {liczba(podsumowanie.ocen)} {ocenSlowo(podsumowanie.ocen)}
        </p>
      </div>
      {opinie.length ? (
        <ul className="mt-3">
          {opinie.map((o) => (
            <JednaOpinia key={o.id} o={o} oTymProdukcie={o.produkty.some((p) => ids.has(p))} />
          ))}
        </ul>
      ) : null}
      {!pelna ? (
        <Link href="/opinie" className="mt-2 inline-block text-[14px] font-extrabold text-akcent no-underline hover:underline">
          Zobacz wszystkie opinie →
        </Link>
      ) : null}
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">{ZRODLO_OPINII}</p>
    </div>
  );
}

/** C: pasek na stronie głównej — liczby + kilka najnowszych opinii z treścią. */
export function PasekZaufaniaAllegro({ podsumowanie, opinie }: { podsumowanie: PodsumowanieAllegro; opinie: OpiniaAllegro[] }) {
  if (!podsumowanie.procentPolecen || podsumowanie.ocen <= 0) return null;
  // Krótkie, czytelne cytaty z najnowszych opinii polecających; pełna lista (z negatywnymi) — na /opinie.
  const cytaty = opinie.filter((o) => o.polecam && o.tekst.length >= 20 && o.tekst.length <= 180).slice(0, 6);
  return (
    <section className="mt-3 rounded-2xl bg-akcent p-4 text-white md:mt-8 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="whitespace-nowrap text-[26px] font-extrabold tracking-tight md:text-[30px]">{podsumowanie.procentPolecen}%</span>
          <span className="text-[14.5px] font-bold md:text-[16px]">
            kupujących poleca nas na Allegro · {liczba(podsumowanie.ocen)} {ocenSlowo(podsumowanie.ocen)}
          </span>
        </p>
        <Link href="/opinie" className="text-[13.5px] font-bold text-white/90 no-underline hover:underline">
          Wszystkie opinie →
        </Link>
      </div>
      {cytaty.length ? (
        <div className="-mx-4 mt-3 grid snap-x auto-cols-[78%] grid-flow-col gap-2.5 overflow-x-auto overflow-y-hidden px-4 pb-1 sm:auto-cols-[40%] md:mx-0 md:auto-cols-[calc((100%-2*12px)/3)] md:gap-3 md:px-0 [&::-webkit-scrollbar]:hidden">
          {cytaty.map((o) => (
            <figure key={o.id} className="m-0 snap-start rounded-xl bg-white p-3.5 text-ink">
              <blockquote className="m-0 text-[13.5px] leading-relaxed">„{o.tekst}”</blockquote>
              <figcaption className="mt-1.5 text-[12px] text-ink-2">
                {o.login} · {dzien(o.data)}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}
