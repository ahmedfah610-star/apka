"use client";

import { useState } from "react";

interface Pozycja {
  nazwa: string;
  ilosc: number;
  rozmiar: string | null;
}
interface Zamowienie {
  numer: string;
  status: string;
  data: string;
  razem: number;
  dostawa: number;
  metoda: string;
  pozycje: Pozycja[];
}

const ETYKIETY: Record<string, string> = {
  nowe: "Przyjęte — w przygotowaniu",
  oczekuje_na_platnosc: "Oczekuje na płatność",
  oplacone: "Opłacone — w przygotowaniu",
  wyslane: "Wysłane",
  anulowane: "Anulowane",
};

const KROKI = ["Złożone", "Opłacone", "Wysłane"];
function etap(status: string): number {
  if (status === "wyslane") return 2;
  if (status === "oplacone") return 1;
  return 0;
}

const zl = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;
const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

export function SledzenieZamowienia() {
  const [numer, setNumer] = useState("");
  const [email, setEmail] = useState("");
  const [wysylka, setWysylka] = useState(false);
  const [blad, setBlad] = useState("");
  const [zam, setZam] = useState<Zamowienie | null>(null);

  async function sprawdz(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setZam(null);
    if (!numer.trim() || !email.trim()) return setBlad("Podaj numer zamówienia i e-mail.");
    setWysylka(true);
    try {
      const r = await fetch("/api/zamowienie-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numer, email }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; zamowienie?: Zamowienie };
      if (!r.ok || d.ok === false || !d.zamowienie) {
        setWysylka(false);
        return setBlad(d.blad || "Nie znaleziono zamówienia.");
      }
      setZam(d.zamowienie);
    } catch {
      setBlad("Błąd połączenia. Spróbuj ponownie.");
    }
    setWysylka(false);
  }

  const input = "w-full border border-linia-2 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-ink";
  const anulowane = zam?.status === "anulowane";
  const krok = zam ? etap(zam.status) : 0;

  return (
    <div>
      <form onSubmit={sprawdz} className="mb-8 flex flex-col gap-3 border border-linia bg-white p-5 md:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Numer zamówienia (np. a1b2c3d4)" value={numer} onChange={(e) => setNumer(e.target.value)} />
          <input className={input} type="email" placeholder="E-mail z zamówienia" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {blad ? <p className="text-[13px] text-akcent">{blad}</p> : null}
        <button
          type="submit"
          disabled={wysylka}
          className="self-start bg-ink px-7 py-3.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
        >
          {wysylka ? "SPRAWDZAM…" : "SPRAWDŹ STATUS"}
        </button>
        <p className="text-[12.5px] text-ink-2">Numer zamówienia znajdziesz w e-mailu z potwierdzeniem (8 znaków).</p>
      </form>

      {zam ? (
        <div className="border border-linia bg-white p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold">Zamówienie #{zam.numer}</h2>
            <span className="text-[13px] text-ink-2">z dnia {DATA_PL(zam.data)}</span>
          </div>

          {anulowane ? (
            <p className="mb-5 border border-akcent/40 bg-akcent/5 px-4 py-3 text-[14px] font-medium text-akcent">Status: Anulowane</p>
          ) : (
            <>
              <p className="mb-4 text-[14px] font-semibold">{ETYKIETY[zam.status] ?? zam.status}</p>
              <div className="mb-6 flex items-center">
                {KROKI.map((k, i) => (
                  <div key={k} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                          i <= krok ? "bg-[oklch(60%_0.13_150)] text-white" : "bg-szary text-ink-2"
                        }`}
                      >
                        {i < krok ? "✓" : i + 1}
                      </span>
                      <span className={`mt-1.5 text-[12px] ${i <= krok ? "font-semibold text-ink" : "text-ink-2"}`}>{k}</span>
                    </div>
                    {i < KROKI.length - 1 ? <span className={`mx-1 h-[2px] flex-1 ${i < krok ? "bg-[oklch(60%_0.13_150)]" : "bg-linia"}`} /> : null}
                  </div>
                ))}
              </div>
              {zam.status === "oczekuje_na_platnosc" ? (
                <p className="mb-4 text-[13px] text-ink-2">To zamówienie czeka na zaksięgowanie płatności.</p>
              ) : null}
            </>
          )}

          <div className="border-t border-linia pt-4">
            <ul className="mb-3 flex flex-col gap-1.5 text-[14px]">
              {zam.pozycje.map((p, i) => (
                <li key={i} className="flex justify-between gap-3 text-ink-2">
                  <span>
                    {p.nazwa}
                    {p.rozmiar ? ` · rozm. ${p.rozmiar}` : ""} × {p.ilosc}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-ink-2">Dostawa: {zam.metoda || "—"}</p>
            <p className="mt-1 text-[15px] font-bold">Razem: {zl(zam.razem)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
