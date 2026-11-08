"use client";

import { useEffect, useState } from "react";

interface Konto {
  id: string;
  email: string;
  imie: string;
  utworzono: string;
  potwierdzone: boolean;
  kupil: boolean;
  kodWyslany: string | null;
  zgoda: boolean | null;
}

const kiedy = (iso: string) => {
  const d = new Date(iso);
  const godz = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return `dziś, ${godz}`;
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return `wczoraj, ${godz}`;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
};

// Nowe konta klientów + kod powitalny NOWY5 (sam wysyła się dobę po rejestracji, gdy nic nie kupią;
// tu można go wysłać od razu).
export function NoweKonta() {
  const [konta, setKonta] = useState<Konto[] | null>(null);
  const [kod, setKod] = useState({ kod: "NOWY5", procent: 5 });
  const [blad, setBlad] = useState("");
  const [wszystkie, setWszystkie] = useState(false);
  const [stan, setStan] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/konta")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) return setBlad(d.blad || "Nie udało się wczytać kont.");
        setKonta(d.items);
        if (d.kod) setKod(d.kod);
      })
      .catch(() => setBlad("Nie udało się wczytać kont."));
  }, []);

  async function wyslij(k: Konto) {
    if (k.kodWyslany && !confirm(`Kod już był wysłany do ${k.email}. Wysłać ponownie?`)) return;
    if (!k.kodWyslany && !confirm(`Wysłać kod ${kod.kod} (−${kod.procent}%) na ${k.email}?`)) return;
    setStan((s) => ({ ...s, [k.id]: "…" }));
    try {
      const r = await fetch("/api/admin/konta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: k.id }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; czas?: string };
      if (!r.ok || !d.ok) return setStan((s) => ({ ...s, [k.id]: d.blad || "Nie udało się wysłać." }));
      setKonta((l) => (l ?? []).map((x) => (x.id === k.id ? { ...x, kodWyslany: d.czas ?? new Date().toISOString() } : x)));
      setStan((s) => ({ ...s, [k.id]: "" }));
    } catch {
      setStan((s) => ({ ...s, [k.id]: "Błąd połączenia." }));
    }
  }

  const widoczne = (konta ?? []).slice(0, wszystkie ? 200 : 8);

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-[18px] font-bold tracking-tight">Nowe konta</h2>
        <p className="text-[13px] text-ink-2">
          Kod powitalny <strong className="text-ink">{kod.kod}</strong> (−{kod.procent}% od produktów, bez minimum, raz na e-mail) wysyła się sam
          dobę po rejestracji — tylko do osób, które zaznaczyły zgodę na kody i nowości, i jeszcze nic nie kupiły. Możesz go też wysłać od razu.
        </p>
      </div>
      {blad ? <p className="text-[13px] text-[oklch(50%_0.19_25)]">{blad}</p> : null}
      {!konta && !blad ? <p className="text-[13px] text-ink-2">Wczytywanie…</p> : null}
      {konta && konta.length === 0 ? <p className="text-[13px] text-ink-2">Nikt jeszcze nie założył konta.</p> : null}
      {widoczne.length ? (
        <div className="divide-y divide-linia rounded-xl border border-linia bg-white">
          {widoczne.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-tight">
                  {k.imie || "—"} <span className="font-normal text-ink-2">· {kiedy(k.utworzono)}</span>
                </p>
                <a href={`mailto:${k.email}`} className="break-all text-[13px] text-ink-2 underline-offset-2 hover:underline">
                  {k.email}
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                {k.kupil ? <span className="rounded-full bg-[oklch(90%_0.07_150)] px-2.5 py-1 font-semibold text-[oklch(42%_0.13_150)]">kupił(a) ✓</span> : null}
                {k.zgoda === true ? <span className="rounded-full bg-akcent-2 px-2.5 py-1 font-semibold text-akcent">zgoda ✓</span> : null}
                {k.zgoda === false ? <span className="rounded-full bg-szary px-2.5 py-1 text-ink-2">bez zgody — nie wysyłamy</span> : null}
                {k.zgoda === null ? <span className="rounded-full bg-szary px-2.5 py-1 text-ink-2" title="Konto założone, zanim był checkbox zgody — automat mu nie wyśle, ręcznie możesz.">konto sprzed zgody</span> : null}
                {!k.potwierdzone ? <span className="rounded-full bg-szary px-2.5 py-1 text-ink-2">e-mail niepotwierdzony</span> : null}
                {k.kodWyslany ? <span className="text-ink-2">kod wysłany {kiedy(k.kodWyslany)}</span> : null}
                {!k.kupil && k.zgoda !== false ? (
                  <button
                    onClick={() => void wyslij(k)}
                    disabled={stan[k.id] === "…"}
                    className={`rounded-lg px-3 py-1.5 font-bold disabled:opacity-60 ${k.kodWyslany ? "border border-linia-2 text-ink hover:border-ink" : "bg-akcent text-white hover:opacity-90"}`}
                  >
                    {stan[k.id] === "…" ? "Wysyłanie…" : k.kodWyslany ? "Wyślij ponownie" : `Wyślij kod ${kod.kod}`}
                  </button>
                ) : null}
                {stan[k.id] && stan[k.id] !== "…" ? <span className="w-full text-right font-semibold text-[oklch(50%_0.19_25)]">{stan[k.id]}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {konta && konta.length > 8 ? (
        <button onClick={() => setWszystkie((w) => !w)} className="mt-2 text-[13px] font-semibold text-ink underline underline-offset-2">
          {wszystkie ? "Pokaż mniej" : `Pokaż wszystkie (${konta.length})`}
        </button>
      ) : null}
    </section>
  );
}
