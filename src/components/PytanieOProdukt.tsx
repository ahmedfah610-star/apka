"use client";

import { useEffect, useRef, useState } from "react";
import type { Produkt } from "@/data/produkty";
import { zdjecie } from "@/lib/zdjecia";
import { formatCena } from "@/lib/filtrowanie";
import { useAuth } from "@/components/AuthContext";
import { MAX_TRESC, SZYBKIE_PYTANIA } from "@/lib/pytania";

const KLUCZ_EMAIL = "bobas-email-pytanie";

// „Masz pytanie o ten produkt?" — ramka pod przyciskiem koszyka i okno z pytaniem
// (od dołu na telefonie, na środku na komputerze). Pytanie trafia do panelu (Pytania klientów).
export function PytanieOProdukt({ produkt, rozmiar }: { produkt: Produkt; rozmiar?: string }) {
  const { user } = useAuth();
  const [otwarte, setOtwarte] = useState(false);
  const [tresc, setTresc] = useState("");
  const [email, setEmail] = useState("");
  const [www, setWww] = useState(""); // pułapka na boty (ukryte pole)
  const [stan, setStan] = useState<"formularz" | "wysylanie" | "wyslane">("formularz");
  const [blad, setBlad] = useState("");
  const pole = useRef<HTMLTextAreaElement>(null);

  // E-mail: z konta albo z poprzedniego pytania.
  useEffect(() => {
    if (!otwarte || email) return;
    let zapis = "";
    try {
      zapis = localStorage.getItem(KLUCZ_EMAIL) ?? "";
    } catch {
      /* ignoruj */
    }
    setEmail(user?.email ?? zapis);
  }, [otwarte]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!otwarte) return;
    const poprzedni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOtwarte(false);
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = poprzedni;
      window.removeEventListener("keydown", esc);
    };
  }, [otwarte]);

  const otworz = () => {
    setStan("formularz");
    setBlad("");
    setOtwarte(true);
  };

  const szybkie = (tekst: string) => {
    const t = rozmiar ? tekst.replace("rozmiarze …", `rozmiarze ${rozmiar}`) : tekst;
    setTresc(t);
    setTimeout(() => pole.current?.focus(), 0);
  };

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    if (tresc.trim().length < 5) return setBlad("Napisz, o co chcesz zapytać.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setBlad("Podaj poprawny adres e-mail — na niego odpiszemy.");
    setStan("wysylanie");
    try {
      const r = await fetch("/api/pytanie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produktId: produkt.id, rozmiar: rozmiar ?? null, email: email.trim(), tresc: tresc.trim(), www }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!r.ok || !d.ok) {
        setStan("formularz");
        setBlad(d.blad || (r.status === 429 ? "Za dużo pytań naraz — spróbuj za kilka minut." : "Nie udało się wysłać. Spróbuj ponownie."));
        return;
      }
      try {
        localStorage.setItem(KLUCZ_EMAIL, email.trim());
      } catch {
        /* ignoruj */
      }
      setStan("wyslane");
      setTresc("");
    } catch {
      setStan("formularz");
      setBlad("Brak połączenia. Spróbuj ponownie.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={otworz}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-linia bg-white px-3.5 py-3 text-left transition-colors hover:border-ink-2"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-akcent-2 text-[17px]" aria-hidden>
          💬
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink">Masz pytanie o ten produkt?</span>
          <span className="block text-[12.5px] leading-snug text-ink-2">Rozmiar, wymiary, dostępność — odpowiadamy zwykle w kilka godzin</span>
        </span>
        <span className="shrink-0 text-[13.5px] font-bold text-akcent">Napisz ›</span>
      </button>

      {otwarte ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Zapytaj o produkt">
          <div className="absolute inset-0" onClick={() => setOtwarte(false)} />
          <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-3 shadow-2xl sm:max-w-[480px] sm:rounded-2xl sm:pt-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-linia-2 sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold">{stan === "wyslane" ? "Pytanie wysłane!" : "Zapytaj o produkt"}</h2>
              <button type="button" onClick={() => setOtwarte(false)} aria-label="Zamknij" className="-mr-1 flex h-9 w-9 items-center justify-center text-ink-2 hover:text-ink">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {stan === "wyslane" ? (
              <div className="py-3 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-akcent-2 text-[26px] text-akcent">✓</div>
                <p className="text-[14.5px] leading-relaxed text-ink-2">
                  Odpowiemy na <strong className="text-ink">{email}</strong>, zwykle w ciągu kilku godzin w dni robocze. Kopię pytania wysłaliśmy na Twój e-mail.
                </p>
                <button type="button" onClick={() => setOtwarte(false)} className="mt-5 w-full rounded-xl border-[1.5px] border-ink py-3 text-[15px] font-bold">
                  Wróć do produktu
                </button>
              </div>
            ) : (
              <form onSubmit={wyslij} noValidate>
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-linia p-2.5">
                  {produkt.zdjecie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={zdjecie(produkt.zdjecie, "s128")} alt="" className="h-12 w-12 shrink-0 object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13.5px] font-bold leading-snug">{produkt.nazwa}</p>
                    <p className="text-[12.5px] text-ink-2">
                      {formatCena(produkt.cena)} zł{rozmiar ? ` · wybrany rozmiar: ${rozmiar}` : ""}
                    </p>
                  </div>
                </div>

                <p className="mb-1.5 text-[12.5px] font-bold">Szybkie pytania</p>
                <div className="mb-1 flex flex-wrap gap-1.5">
                  {SZYBKIE_PYTANIA.map((s) => (
                    <button
                      key={s.etykieta}
                      type="button"
                      onClick={() => szybkie(s.tekst)}
                      className="rounded-full border border-linia-2 px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:border-akcent hover:text-akcent"
                    >
                      {s.etykieta}
                    </button>
                  ))}
                </div>

                <label className="mb-1.5 mt-3 block text-[12.5px] font-bold text-ink-2" htmlFor="pytanie-tresc">
                  Twoje pytanie
                </label>
                <textarea
                  id="pytanie-tresc"
                  ref={pole}
                  rows={4}
                  maxLength={MAX_TRESC}
                  value={tresc}
                  onChange={(e) => setTresc(e.target.value)}
                  placeholder="Np. córka ma 7 miesięcy i 70 cm — który rozmiar będzie lepszy?"
                  className="w-full rounded-xl border-[1.5px] border-linia-2 px-3.5 py-3 text-[15px] outline-none focus:border-ink"
                />

                <label className="mb-1.5 mt-3 block text-[12.5px] font-bold text-ink-2" htmlFor="pytanie-email">
                  E-mail do odpowiedzi
                </label>
                <input
                  id="pytanie-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.pl"
                  className="w-full rounded-xl border-[1.5px] border-linia-2 px-3.5 py-3 text-[15px] outline-none focus:border-ink"
                />
                {/* Pułapka na boty — niewidoczna dla ludzi */}
                <input type="text" name="www" tabIndex={-1} autoComplete="off" value={www} onChange={(e) => setWww(e.target.value)} className="hidden" aria-hidden />

                {blad ? <p className="mt-3 text-[13px] font-semibold text-[oklch(50%_0.19_25)]">{blad}</p> : null}

                <button
                  type="submit"
                  disabled={stan === "wysylanie"}
                  className="mt-4 w-full rounded-xl bg-akcent py-3.5 text-[15px] font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {stan === "wysylanie" ? "Wysyłanie…" : "Wyślij pytanie"}
                </button>
                <p className="mt-2.5 text-[12px] leading-relaxed text-ink-2">
                  Odpowiemy na ten e-mail, zwykle w ciągu kilku godzin (pon.–pt.). Adresu używamy tylko do odpowiedzi —{" "}
                  <a href="/polityka-prywatnosci" target="_blank" className="underline">
                    polityka prywatności
                  </a>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
