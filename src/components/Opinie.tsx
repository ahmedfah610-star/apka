"use client";

import { useEffect, useState } from "react";

interface Opinia {
  id: string;
  imie: string;
  ocena: number;
  tresc: string | null;
  utworzono: string;
}

function Gwiazdki({ ocena, rozmiar = 16 }: { ocena: number; rozmiar?: number }) {
  return (
    <span className="inline-flex" aria-label={`Ocena ${ocena} na 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={rozmiar} height={rozmiar} viewBox="0 0 24 24" className={i <= Math.round(ocena) ? "text-akcent" : "text-linia-2"} fill="currentColor">
          <path d="m12 17.3-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z" />
        </svg>
      ))}
    </span>
  );
}

const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export function Opinie({ produktId }: { produktId: string }) {
  const [opinie, setOpinie] = useState<Opinia[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [formOtwarty, setFormOtwarty] = useState(false);

  const [imie, setImie] = useState("");
  const [email, setEmail] = useState("");
  const [ocena, setOcena] = useState(0);
  const [hover, setHover] = useState(0);
  const [tresc, setTresc] = useState("");
  const [hp, setHp] = useState("");
  const [wysylka, setWysylka] = useState(false);
  const [blad, setBlad] = useState("");
  const [sukces, setSukces] = useState(false);

  async function wczytaj() {
    try {
      const r = await fetch(`/api/opinie?produkt=${encodeURIComponent(produktId)}`);
      const d = (await r.json()) as { items: Opinia[] };
      setOpinie(Array.isArray(d.items) ? d.items : []);
    } catch {
      setOpinie([]);
    }
    setLadowanie(false);
  }

  useEffect(() => {
    wczytaj();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produktId]);

  // Otwórz formularz i wypełnij e-mail, gdy przyjście z maila „oceń zakup”
  // (?opinia=1&email=...). Czytamy z URL bez useSearchParams (bez Suspense).
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("opinia")) {
        const e = q.get("email");
        if (e) setEmail(e);
        setFormOtwarty(true);
        setTimeout(() => document.getElementById("opinie")?.scrollIntoView({ behavior: "smooth" }), 300);
      }
    } catch {
      /* ignoruj */
    }
  }, []);

  const liczba = opinie.length;
  const srednia = liczba ? Math.round((opinie.reduce((s, o) => s + o.ocena, 0) / liczba) * 10) / 10 : 0;

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    if (!imie.trim()) return setBlad("Podaj imię.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setBlad("Podaj e-mail użyty przy zamówieniu.");
    if (!(ocena >= 1 && ocena <= 5)) return setBlad("Wybierz ocenę (gwiazdki).");
    setWysylka(true);
    try {
      const r = await fetch("/api/opinie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produktId, imie, email, ocena, tresc, hp }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!r.ok || d.ok === false) {
        setWysylka(false);
        return setBlad(d.blad || "Nie udało się dodać opinii.");
      }
      setSukces(true);
      setImie("");
      setEmail("");
      setOcena(0);
      setTresc("");
      setFormOtwarty(false);
      await wczytaj();
    } catch {
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    setWysylka(false);
  }

  return (
    <section id="opinie" className="scroll-mt-24 px-6 pb-20 md:px-12">
      <div className="mx-auto max-w-content border-t border-linia pt-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">Opinie klientów</h2>
            {liczba > 0 ? (
              <div className="mt-1.5 flex items-center gap-2 text-[14px] text-ink-2">
                <Gwiazdki ocena={srednia} rozmiar={18} />
                <span className="font-semibold text-ink">{srednia.toFixed(1).replace(".", ",")}</span>
                <span>· {liczba} {liczba === 1 ? "opinia" : liczba < 5 ? "opinie" : "opinii"}</span>
              </div>
            ) : (
              <p className="mt-1.5 text-[14px] text-ink-2">Brak opinii — bądź pierwszą osobą, która oceni ten produkt.</p>
            )}
          </div>
          <button
            onClick={() => {
              setFormOtwarty((o) => !o);
              setSukces(false);
            }}
            className="shrink-0 border border-ink px-5 py-2.5 text-[13px] font-semibold tracking-wide text-ink transition-colors hover:bg-ink hover:text-tlo"
          >
            {formOtwarty ? "Anuluj" : "Napisz opinię"}
          </button>
        </div>

        {sukces ? (
          <p className="mb-6 border border-[oklch(66%_0.13_150)]/40 bg-[oklch(96%_0.05_150)] px-4 py-3 text-[14px] text-[oklch(38%_0.12_150)]">
            Dziękujemy! Twoja opinia została dodana.
          </p>
        ) : null}

        {formOtwarty ? (
          <form onSubmit={wyslij} className="mb-8 border border-linia bg-white p-5 md:p-6">
            <p className="mb-4 border-l-2 border-akcent/50 bg-szary/40 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">
              Opinię mogą wystawić klienci, którzy kupili ten produkt. Podaj <strong>e-mail użyty przy zamówieniu</strong> —
              posłuży tylko do weryfikacji zakupu i nie będzie publikowany.
            </p>
            <div className="mb-4">
              <span className="mb-2 block text-[13px] font-semibold text-ink-2">Twoja ocena</span>
              <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOcena(i)}
                    onMouseEnter={() => setHover(i)}
                    aria-label={`${i} gwiazdek`}
                    className="p-0.5"
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" className={i <= (hover || ocena) ? "text-akcent" : "text-linia-2"} fill="currentColor">
                      <path d="m12 17.3-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={imie}
                onChange={(e) => setImie(e.target.value)}
                placeholder="Imię"
                maxLength={40}
                className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail z zamówienia"
                className="w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
              />
            </div>
            <textarea
              value={tresc}
              onChange={(e) => setTresc(e.target.value)}
              placeholder="Twoja opinia (opcjonalnie)"
              rows={3}
              maxLength={1000}
              className="mb-3 w-full resize-y border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink"
            />
            {/* honeypot — ukryte przed użytkownikiem */}
            <input
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            {blad ? <p className="mb-3 text-[13px] text-akcent">{blad}</p> : null}
            <button
              type="submit"
              disabled={wysylka}
              className="bg-ink px-6 py-3 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
            >
              {wysylka ? "WYSYŁANIE…" : "DODAJ OPINIĘ"}
            </button>
          </form>
        ) : null}

        {ladowanie ? (
          <p className="text-[14px] text-ink-2">Ładowanie opinii…</p>
        ) : opinie.length > 0 ? (
          <ul className="flex flex-col divide-y divide-linia border-y border-linia">
            {opinie.map((o) => (
              <li key={o.id} className="py-5">
                <div className="mb-1.5 flex items-center gap-3">
                  <Gwiazdki ocena={o.ocena} />
                  <span className="text-[14px] font-semibold">{o.imie}</span>
                  <span className="text-[12.5px] text-ink-2">{DATA_PL(o.utworzono)}</span>
                </div>
                {o.tresc ? <p className="text-[14.5px] leading-relaxed text-ink-2">{o.tresc}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
