"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

type Tryb = "login" | "rejestr" | "reset";

export function FormularzKonta() {
  const router = useRouter();
  const { user, zaladowano, wlaczone, zaloguj, zarejestruj, zalogujGoogle, resetHasla } = useAuth();
  const [tryb, setTryb] = useState<Tryb>("login");
  const [imie, setImie] = useState("");
  const [email, setEmail] = useState("");
  const [haslo, setHaslo] = useState("");
  const [blad, setBlad] = useState("");
  const [info, setInfo] = useState("");
  const [wysylka, setWysylka] = useState(false);

  useEffect(() => {
    if (zaladowano && user) router.replace("/konto");
  }, [zaladowano, user, router]);

  function przelacz(t: Tryb) {
    setTryb(t);
    setBlad("");
    setInfo("");
  }

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setInfo("");
    setWysylka(true);
    try {
      if (tryb === "reset") {
        const r = await resetHasla(email);
        if (!r.ok) setBlad(r.blad || "Nie udało się wysłać linku.");
        else setInfo("Jeśli konto istnieje, wysłaliśmy link do zmiany hasła na podany e-mail.");
      } else if (tryb === "rejestr") {
        if (haslo.length < 6) { setBlad("Hasło musi mieć co najmniej 6 znaków."); setWysylka(false); return; }
        const r = await zarejestruj(email, haslo, imie);
        if (!r.ok) setBlad(r.blad || "Nie udało się założyć konta.");
        else if (r.potwierdzenie) setInfo("Konto założone! Sprawdź e-mail i potwierdź adres, aby się zalogować.");
        else router.replace("/konto");
      } else {
        const r = await zaloguj(email, haslo);
        if (!r.ok) setBlad(r.blad || "Nie udało się zalogować.");
        else router.replace("/konto");
      }
    } finally {
      setWysylka(false);
    }
  }

  if (!wlaczone) {
    return (
      <div className="rounded-2xl border border-linia bg-white p-8 text-center shadow-[0_2px_24px_-14px_rgba(0,0,0,0.3)]">
        <p className="text-[15px] text-ink-2">Logowanie jest chwilowo niedostępne. Spróbuj później.</p>
      </div>
    );
  }

  const input =
    "w-full rounded-lg border border-linia-2 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-ink";

  const naglowek =
    tryb === "reset" ? "Reset hasła" : tryb === "rejestr" ? "Załóż konto" : "Zaloguj się";
  const podtytul =
    tryb === "reset"
      ? "Podaj e-mail — wyślemy link do ustawienia nowego hasła."
      : "Historia zamówień i koszyk zapisany na każdym urządzeniu.";

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-linia bg-white p-6 shadow-[0_2px_28px_-16px_rgba(0,0,0,0.35)] sm:p-8">
        <h1 className="text-center text-[24px] font-bold tracking-tight md:text-[27px]">{naglowek}</h1>
        <p className="mx-auto mt-1.5 max-w-xs text-center text-[13.5px] leading-relaxed text-ink-2">{podtytul}</p>

        {tryb !== "reset" ? (
          <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 rounded-lg bg-szary/60 p-1">
            {(["login", "rejestr"] as Tryb[]).map((t) => (
              <button
                key={t}
                onClick={() => przelacz(t)}
                className={`rounded-md py-2 text-[13.5px] font-semibold transition-colors ${
                  tryb === t ? "bg-white text-ink shadow-sm" : "text-ink-2 hover:text-ink"
                }`}
              >
                {t === "login" ? "Zaloguj się" : "Załóż konto"}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={wyslij} className="mt-6 flex flex-col gap-3">
          {tryb === "rejestr" ? (
            <input className={input} placeholder="Imię i nazwisko" maxLength={80} value={imie} onChange={(e) => setImie(e.target.value)} />
          ) : null}
          <input className={input} type="email" placeholder="E-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {tryb !== "reset" ? (
            <input
              className={input}
              type="password"
              placeholder="Hasło"
              autoComplete={tryb === "rejestr" ? "new-password" : "current-password"}
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
            />
          ) : null}

          {tryb === "login" ? (
            <button type="button" onClick={() => przelacz("reset")} className="-mt-0.5 self-end text-[12.5px] text-ink-2 underline underline-offset-2 hover:text-akcent">
              Nie pamiętasz hasła?
            </button>
          ) : null}

          {blad ? <p className="rounded-lg bg-akcent/5 px-3 py-2 text-[13px] text-akcent">{blad}</p> : null}
          {info ? <p className="rounded-lg bg-[oklch(95%_0.05_150)] px-3 py-2 text-[13px] text-[oklch(40%_0.12_150)]">{info}</p> : null}

          <button
            type="submit"
            disabled={wysylka}
            className="mt-1 rounded-lg bg-ink px-6 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
          >
            {wysylka ? "CHWILA…" : tryb === "login" ? "ZALOGUJ SIĘ" : tryb === "rejestr" ? "ZAŁÓŻ KONTO" : "WYŚLIJ LINK"}
          </button>
        </form>

        {tryb !== "reset" ? (
          <>
            <div className="my-5 flex items-center gap-3 text-[12px] text-ink-2">
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
          </>
        ) : (
          <button onClick={() => przelacz("login")} className="mt-5 block w-full text-center text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
            ← Wróć do logowania
          </button>
        )}
      </div>

      <p className="mt-5 text-center text-[13px] text-ink-2">
        Chcesz tylko kupić?{" "}
        <Link href="/produkty" className="font-medium text-ink underline underline-offset-2 hover:text-akcent">
          Kontynuuj jako gość →
        </Link>
      </p>
    </div>
  );
}
