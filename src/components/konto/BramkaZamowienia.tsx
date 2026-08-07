"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { KrokiZamowienia } from "@/components/KrokiZamowienia";
import { useAuth } from "@/components/AuthContext";
import { useKoszyk } from "@/components/KoszykContext";

type Tryb = "login" | "rejestr";

export function BramkaZamowienia() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, zaloguj, zarejestruj, zalogujGoogle } = useAuth();
  const { pozycje } = useKoszyk();

  const [pokazFormularz, setPokazFormularz] = useState(false);
  const [tryb, setTryb] = useState<Tryb>("login");
  const [imie, setImie] = useState("");
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [blad, setBlad] = useState("");
  const [info, setInfo] = useState("");
  const [wysylka, setWysylka] = useState(false);

  // Pusty koszyk → z powrotem do koszyka.
  useEffect(() => {
    if (pozycje.length === 0) router.replace("/koszyk");
  }, [pozycje.length, router]);

  // Zalogowany klient pomija bramkę i idzie prosto do dostawy (koszyk zachowany).
  useEffect(() => {
    if (zaladowano && user) router.replace("/zamowienie");
  }, [zaladowano, user, router]);

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setInfo("");
    setWysylka(true);
    try {
      if (tryb === "rejestr") {
        if (haslo.length < 6) { setBlad("Hasło musi mieć co najmniej 6 znaków."); return; }
        const r = await zarejestruj(email, haslo, imie);
        if (!r.ok) setBlad(r.blad || "Nie udało się założyć konta.");
        else if (r.potwierdzenie) setInfo("Konto założone! Potwierdź e-mail — a możesz też od razu kontynuować jako gość, koszyk zostaje.");
        else router.replace("/zamowienie");
      } else {
        const r = await zaloguj(email, haslo);
        if (!r.ok) setBlad(r.blad || "Nie udało się zalogować.");
        else router.replace("/zamowienie"); // koszyk scala się automatycznie po zalogowaniu
      }
    } finally {
      setWysylka(false);
    }
  }

  const input = "w-full rounded-lg border border-linia-2 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-szary/25">
      <Nawigacja />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6 md:py-12">
        <KrokiZamowienia aktywny={1} />
        <h1 className="mb-2 text-[26px] font-bold tracking-tight md:text-[31px]">Jak chcesz złożyć zamówienie?</h1>
        <p className="mb-7 text-[14.5px] leading-relaxed text-ink-2">
          Twój koszyk jest zapisany i zostanie zachowany niezależnie od wyboru. Możesz zamówić bez konta albo się zalogować.
        </p>

        {/* Opcja: gość */}
        <button
          onClick={() => router.push("/zamowienie")}
          className="group flex w-full items-center justify-between gap-4 rounded-xl border border-linia bg-white p-5 text-left transition-all hover:border-ink hover:shadow-[0_4px_20px_-14px_rgba(0,0,0,0.4)]"
        >
          <span className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-szary/70 text-ink transition-colors group-hover:bg-akcent group-hover:text-tlo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>
              <span className="block text-[16px] font-semibold">Kontynuuj jako gość</span>
              <span className="mt-0.5 block text-[13.5px] text-ink-2">Bez zakładania konta — podasz tylko dane do wysyłki.</span>
            </span>
          </span>
          <span className="text-[20px] text-ink-2 transition-transform group-hover:translate-x-0.5 group-hover:text-ink">→</span>
        </button>

        {/* Opcja: konto */}
        {wlaczone ? (
          <div className="mt-3 rounded-xl border border-linia bg-white">
            {!pokazFormularz ? (
              <button
                onClick={() => setPokazFormularz(true)}
                className="group flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-szary/20"
              >
                <span className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-tlo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold">Zaloguj się lub załóż konto</span>
                    <span className="mt-0.5 block text-[13.5px] text-ink-2">Historia zamówień, szybsze zakupy, zapisany koszyk.</span>
                  </span>
                </span>
                <span className="text-[20px] text-ink-2 transition-transform group-hover:translate-x-0.5 group-hover:text-ink">→</span>
              </button>
            ) : (
              <div className="p-5 sm:p-6">
                <div className="mx-auto mb-5 grid max-w-xs grid-cols-2 rounded-lg bg-szary/60 p-1">
                  {(["login", "rejestr"] as Tryb[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTryb(t); setBlad(""); setInfo(""); }}
                      className={`rounded-md py-2 text-[13.5px] font-semibold transition-colors ${tryb === t ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
                    >
                      {t === "login" ? "Zaloguj się" : "Załóż konto"}
                    </button>
                  ))}
                </div>
                <form onSubmit={wyslij} className="flex flex-col gap-3">
                  {tryb === "rejestr" ? (
                    <input className={input} placeholder="Imię" maxLength={40} value={imie} onChange={(e) => setImie(e.target.value)} />
                  ) : null}
                  <input className={input} type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={input} type="password" placeholder="Hasło" autoComplete={tryb === "rejestr" ? "new-password" : "current-password"} value={haslo} onChange={(e) => setHaslo(e.target.value)} />

                  {blad ? <p className="rounded-lg bg-akcent/5 px-3 py-2 text-[13px] text-akcent">{blad}</p> : null}
                  {info ? <p className="rounded-lg bg-[oklch(95%_0.05_150)] px-3 py-2 text-[13px] text-[oklch(40%_0.12_150)]">{info}</p> : null}

                  <button type="submit" disabled={wysylka} className="mt-1 rounded-lg bg-ink px-6 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
                    {wysylka ? "CHWILA…" : tryb === "login" ? "ZALOGUJ SIĘ I PRZEJDŹ DALEJ" : "ZAŁÓŻ KONTO I PRZEJDŹ DALEJ"}
                  </button>
                </form>

                <div className="my-4 flex items-center gap-3 text-[12px] text-ink-2">
                  <span className="h-px flex-1 bg-linia" /> lub <span className="h-px flex-1 bg-linia" />
                </div>
                <button
                  onClick={() => zalogujGoogle()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-linia-2 px-4 py-3 text-[14px] font-medium text-ink transition-colors hover:border-ink hover:bg-szary/30"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.7 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v7.4h12.4c-.3 2-1.6 5-4.6 7l7.1 5.5c4.2-3.9 6.7-9.6 6.7-15.8z" />
                    <path fill="#FBBC05" d="M10.5 28.3c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.9-6.1C1 15.7 0 19.7 0 23.5s1 7.8 2.6 10.9l7.9-6.1z" />
                    <path fill="#34A853" d="M24 47c6.3 0 11.6-2.1 15.4-5.7l-7.1-5.5c-2 1.3-4.6 2.2-8.3 2.2-6.3 0-11.6-3.7-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 47 24 47z" />
                  </svg>
                  Zaloguj przez Google
                </button>

                <p className="mt-4 text-center text-[13px]">
                  <button onClick={() => router.push("/zamowienie")} className="text-ink-2 underline underline-offset-2 hover:text-akcent">
                    …albo pomiń i kontynuuj jako gość →
                  </button>
                </p>
              </div>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-center text-[12.5px] text-ink-2">
          <Link href="/koszyk" className="underline underline-offset-2 hover:text-akcent">← Wróć do koszyka</Link>
        </p>
      </main>
      <Stopka />
    </div>
  );
}
