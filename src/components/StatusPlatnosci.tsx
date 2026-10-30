"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PrzyciskPlatnosci } from "@/components/PrzyciskPlatnosci";

type Stan = "sprawdzam" | "oplacone" | "nieoplacone" | "anulowane" | "nieznany";

const OPLACONE = ["oplacone", "wyslane", "nowe"];
const PROBY = 6; // ~15 s — powiadomienie z Przelewy24 zwykle dochodzi w kilka sekund
const ODSTEP = 2500;

const zl = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;

/**
 * Strona powrotu z płatności: sprawdza, czy wpłata faktycznie doszła. Przelewy24 odsyła tu
 * klienta także po przerwanej płatności — wtedy zamiast „Dziękujemy" pokazujemy, że płatność
 * nie została potwierdzona, i przycisk „Dokończ płatność".
 */
export function StatusPlatnosci({ id }: { id: string }) {
  const [stan, setStan] = useState<Stan>("sprawdzam");
  const [razem, setRazem] = useState<number | null>(null);
  const [zaplacone, setZaplacone] = useState(false);
  const nr = id.slice(0, 8);

  const sprawdz = useCallback(
    async (proby: number) => {
      setStan("sprawdzam");
      for (let i = 0; i < proby; i++) {
        try {
          const r = await fetch(`/api/zamowienie-status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
          const d = (await r.json()) as { ok?: boolean; status?: string; razem?: number };
          if (!d.ok || !d.status) {
            if (r.status !== 429) return setStan("nieznany");
          } else {
            if (typeof d.razem === "number") setRazem(d.razem);
            if (OPLACONE.includes(d.status)) {
              setZaplacone(d.status !== "nowe"); // „nowe" = zamówienie bez płatności online
              return setStan("oplacone");
            }
            if (d.status === "anulowane") return setStan("anulowane");
          }
        } catch {
          /* spróbuj ponownie */
        }
        if (i < proby - 1) await new Promise((res) => setTimeout(res, ODSTEP));
      }
      setStan("nieoplacone");
    },
    [id],
  );

  useEffect(() => {
    sprawdz(PROBY);
  }, [sprawdz]);

  const numer = (
    <p className="mb-2 text-[14px] text-ink-2">
      Numer zamówienia: <strong className="text-ink">#{nr}</strong>
    </p>
  );

  if (stan === "sprawdzam") {
    return (
      <>
        <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-szary border-t-ink" aria-hidden />
        <h1 className="mb-3 text-[28px] font-extrabold tracking-tight md:text-[32px]">Sprawdzamy płatność…</h1>
        {numer}
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">To potrwa tylko kilka sekund.</p>
      </>
    );
  }

  if (stan === "nieoplacone") {
    return (
      <>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(92%_0.07_85)] text-2xl font-bold text-[oklch(45%_0.12_75)]">!</div>
        <h1 className="mb-3 text-[28px] font-extrabold tracking-tight md:text-[32px]">Płatność nie została potwierdzona</h1>
        {numer}
        <p className="mx-auto mb-6 max-w-md text-[15px] leading-relaxed text-ink-2">
          Zamówienie zapisaliśmy, ale nie otrzymaliśmy jeszcze wpłaty{razem ? ` ${zl(razem)}` : ""}. Jeśli płatność została
          przerwana, dokończ ją teraz — wyślemy paczkę zaraz po jej zaksięgowaniu.
        </p>
        <div className="mb-5 flex justify-center">
          <PrzyciskPlatnosci id={id} />
        </div>
        <p className="mx-auto mb-8 max-w-md text-[13px] leading-relaxed text-ink-2">
          Już zapłaciłeś? Potwierdzenie z banku czasem chwilę trwa —{" "}
          <button onClick={() => sprawdz(3)} className="font-semibold text-ink underline underline-offset-2 hover:text-akcent">
            sprawdź ponownie
          </button>
          .
        </p>
      </>
    );
  }

  if (stan === "anulowane") {
    return (
      <>
        <h1 className="mb-3 text-[28px] font-extrabold tracking-tight md:text-[32px]">Zamówienie zostało anulowane</h1>
        {numer}
        <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
          Masz pytania? <Link href="/kontakt" className="text-ink underline underline-offset-2">Napisz do nas</Link>.
        </p>
      </>
    );
  }

  // Opłacone (albo statusu nie udało się sprawdzić — nie straszymy klienta).
  return (
    <>
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(66%_0.13_150)] text-2xl text-tlo">✓</div>
      <h1 className="mb-3 text-[30px] font-extrabold tracking-tight md:text-[34px]">Dziękujemy za zamówienie!</h1>
      {zaplacone ? <p className="mb-2 text-[14px] font-semibold text-[oklch(45%_0.13_150)]">Płatność przyjęta</p> : null}
      {numer}
      <p className="mx-auto mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
        Potwierdzenie wyślemy na Twój e-mail. Zajmiemy się kompletowaniem paczki i damy znać, gdy ruszy w drogę.
      </p>
    </>
  );
}
