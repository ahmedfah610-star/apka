"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { sbBrowser } from "@/lib/supabaseBrowser";

type Stan = "ladowanie" | "ok" | "blad";
const KARTA = "rounded-2xl border border-linia bg-white p-8 text-center shadow-[0_2px_28px_-16px_rgba(0,0,0,0.35)]";

function Rdzen() {
  const router = useRouter();
  const params = useSearchParams();
  const [stan, setStan] = useState<Stan>("ladowanie");

  useEffect(() => {
    const sb = sbBrowser();
    const token_hash = params.get("token_hash");
    const type = params.get("type");
    const next = params.get("next") || "/konto";
    if (!sb || !token_hash || !type) {
      setStan("blad");
      return;
    }
    let anulowane = false;
    // verifyOtp z token_hash — potwierdza adres i ustawia sesję (bez zależności
    // od hasha w URL, odporne na skanery linków w poczcie).
    sb.auth.verifyOtp({ type: type as never, token_hash }).then(({ error }) => {
      if (anulowane) return;
      if (error) {
        setStan("blad");
      } else {
        setStan("ok");
        setTimeout(() => router.replace(next), 900);
      }
    });
    return () => {
      anulowane = true;
    };
  }, [params, router]);

  if (stan === "ladowanie") {
    return (
      <div className={KARTA}>
        <h1 className="mb-2 text-[22px] font-bold tracking-tight">Potwierdzamy Twój adres…</h1>
        <p className="text-[15px] text-ink-2">Chwila — aktywujemy Twoje konto.</p>
      </div>
    );
  }
  if (stan === "ok") {
    return (
      <div className={KARTA}>
        <h1 className="mb-2 text-[22px] font-bold tracking-tight">E-mail potwierdzony ✓</h1>
        <p className="text-[15px] text-ink-2">Przenosimy Cię do konta…</p>
      </div>
    );
  }
  return (
    <div className={KARTA}>
      <h1 className="mb-2 text-[22px] font-bold tracking-tight">Link wygasł lub jest nieprawidłowy</h1>
      <p className="mb-5 text-[15px] leading-relaxed text-ink-2">
        Poproś o nowy link — zaloguj się swoim e-mailem, a wyślemy świeże potwierdzenie.
      </p>
      <Link
        href="/konto/logowanie"
        className="inline-block rounded-lg bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
      >
        WRÓĆ DO LOGOWANIA
      </Link>
    </div>
  );
}

export function PotwierdzenieMaila() {
  return (
    <Suspense fallback={<div className={KARTA}><p className="text-[15px] text-ink-2">Ładowanie…</p></div>}>
      <Rdzen />
    </Suspense>
  );
}
