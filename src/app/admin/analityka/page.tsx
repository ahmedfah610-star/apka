"use client";

import { useEffect, useMemo, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

type Dane = {
  ok: boolean;
  powod?: string;
  podsumowanie?: { uzytkownicy: number; sesje: number; odslony: number; zaangazowanie: number; srCzas: number };
  seria?: { data: string; uzytkownicy: number }[];
  kanaly?: { kanal: string; sesje: number; uzytkownicy: number }[];
  strony?: { tytul: string; odslony: number }[];
  produkty?: { tytul: string; sciezka: string; odslony: number }[];
  urzadzenia?: { typ: string; uzytkownicy: number }[];
  zdarzenia?: { nazwa: string; liczba: number }[];
  naZywo?: number;
};

const liczba = (n: number) => new Intl.NumberFormat("pl-PL").format(Math.round(n || 0));
const czas = (s: number) => {
  const m = Math.floor((s || 0) / 60);
  const r = Math.round((s || 0) % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

function Sparkline({ dane }: { dane: { data: string; uzytkownicy: number }[] }) {
  if (dane.length < 2) return null;
  const w = 720;
  const h = 90;
  const max = Math.max(1, ...dane.map((d) => d.uzytkownicy));
  const krok = w / (dane.length - 1);
  const pkt = dane.map((d, i) => [i * krok, h - (d.uzytkownicy / max) * (h - 10) - 4]);
  const linia = pkt.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const obszar = `${linia} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Użytkownicy dziennie">
      <path d={obszar} fill="var(--akcent, oklch(63% 0.14 40))" opacity="0.1" />
      <path d={linia} fill="none" stroke="var(--akcent, oklch(63% 0.14 40))" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={pkt[pkt.length - 1][0]} cy={pkt[pkt.length - 1][1]} r="3.5" fill="var(--akcent, oklch(63% 0.14 40))" />
    </svg>
  );
}

function Kafel({ etykieta, wartosc, pod }: { etykieta: string; wartosc: string; pod?: string }) {
  return (
    <div className="border border-linia bg-white p-5">
      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">{etykieta}</p>
      <p className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{wartosc}</p>
      {pod ? <p className="mt-1.5 text-[12px] text-ink-2">{pod}</p> : null}
    </div>
  );
}

function Tabela({ tytul, wiersze }: { tytul: string; wiersze: { l: string; v: string; sub?: string }[] }) {
  return (
    <section className="border border-linia bg-white p-6">
      <h2 className="mb-4 text-[16px] font-bold">{tytul}</h2>
      {wiersze.length === 0 ? (
        <p className="text-[13px] text-ink-2">Brak danych w tym okresie.</p>
      ) : (
        <div className="flex flex-col divide-y divide-linia">
          {wiersze.map((w, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[13.5px]" title={w.l}>
                {w.l}
                {w.sub ? <span className="ml-1 text-[12px] text-ink-2">{w.sub}</span> : null}
              </span>
              <span className="shrink-0 text-[13.5px] font-semibold tabular-nums">{w.v}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Analityka() {
  const [d, setD] = useState<Dane | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);

  const wczytaj = async () => {
    setLadowanie(true);
    setBlad(null);
    try {
      const r = await fetch("/api/admin/ga4");
      const j = (await r.json()) as Dane;
      setD(j);
    } catch {
      setBlad("Nie udało się pobrać danych z GA4.");
    } finally {
      setLadowanie(false);
    }
  };
  useEffect(() => {
    void wczytaj();
  }, []);

  const maxUrzadz = useMemo(() => Math.max(1, ...(d?.urzadzenia ?? []).map((u) => u.uzytkownicy)), [d]);

  if (ladowanie) return <p className="py-16 text-center text-[15px] text-ink-2">Wczytuję dane z GA4…</p>;

  if (d && !d.ok && d.powod === "brak_konfiguracji") {
    return (
      <div>
        <h1 className="mb-1 text-[26px] font-bold tracking-tight">Analityka</h1>
        <p className="mb-6 text-[14px] text-ink-2">Dane na żywo z Google Analytics 4.</p>
        <div className="max-w-2xl border border-linia bg-white p-6">
          <h2 className="mb-2 text-[16px] font-bold">Podłącz GA4 do panelu (jednorazowo)</h2>
          <p className="mb-4 text-[13.5px] leading-relaxed text-ink-2">
            Panel czyta dane przez konto serwisowe Google. Ustaw to raz, a potem statystyki będą tu same.
          </p>
          <ol className="ml-4 list-decimal space-y-2 text-[13.5px] leading-relaxed">
            <li>W <b>Google Cloud Console</b> włącz „Google Analytics Data API" i utwórz <b>konto serwisowe</b>, a do niego klucz JSON.</li>
            <li>W <b>GA4 → Administracja → Dostęp do usługi</b> dodaj e-mail konta serwisowego jako <b>Czytelnik</b>.</li>
            <li>
              W <b>Vercel → Settings → Environment Variables</b> dodaj trzy zmienne z pliku JSON:
              <div className="mt-2 rounded bg-szary p-3 font-mono text-[12px] leading-relaxed">
                GA4_PROPERTY_ID = <span className="text-ink-2">numer usługi (same cyfry)</span>
                <br />GA4_CLIENT_EMAIL = <span className="text-ink-2">client_email z JSON</span>
                <br />GA4_PRIVATE_KEY = <span className="text-ink-2">private_key z JSON (z \n)</span>
              </div>
            </li>
            <li>Zrób <b>Redeploy</b> — dane pojawią się tutaj.</li>
          </ol>
        </div>
      </div>
    );
  }

  if (blad || (d && !d.ok)) {
    return (
      <div>
        <h1 className="mb-1 text-[26px] font-bold tracking-tight">Analityka</h1>
        <p className="mt-4 text-[14px] text-akcent">{blad || "GA4 zwróciło błąd. Sprawdź uprawnienia konta serwisowego i numer usługi."}</p>
        <button onClick={() => void wczytaj()} className="mt-4 border border-ink px-4 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const p = d?.podsumowanie;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Analityka</h1>
          <p className="text-[14px] text-ink-2">Google Analytics 4 · ostatnie 28 dni</p>
        </div>
        <div className="flex items-center gap-2 border border-linia bg-white px-3.5 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(72%_0.12_150)] opacity-75" />
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[oklch(60%_0.13_150)]" />
          </span>
          <span className="text-[13px] font-semibold tabular-nums">{liczba(d?.naZywo ?? 0)}</span>
          <span className="text-[12px] text-ink-2">aktywnych teraz</span>
        </div>
      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kafel etykieta="Użytkownicy" wartosc={liczba(p?.uzytkownicy ?? 0)} pod="unikalni, 28 dni" />
        <Kafel etykieta="Sesje" wartosc={liczba(p?.sesje ?? 0)} pod="wizyty w sklepie" />
        <Kafel etykieta="Odsłony" wartosc={liczba(p?.odslony ?? 0)} pod="wyświetlone strony" />
        <Kafel etykieta="Zaangażowanie" wartosc={`${Math.round((p?.zaangazowanie ?? 0) * 100)}%`} pod={`śr. czas ${czas(p?.srCzas ?? 0)}`} />
      </div>

      {/* Wykres */}
      <section className="mb-6 border border-linia bg-white p-6">
        <h2 className="mb-3 text-[16px] font-bold">Użytkownicy dziennie</h2>
        <Sparkline dane={d?.seria ?? []} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tabela
          tytul="Skąd przychodzą (źródła ruchu)"
          wiersze={(d?.kanaly ?? []).map((k) => ({ l: k.kanal || "(nieznane)", v: `${liczba(k.sesje)} sesji`, sub: `· ${liczba(k.uzytkownicy)} os.` }))}
        />
        <Tabela tytul="Najczęściej oglądane produkty" wiersze={(d?.produkty ?? []).map((x) => ({ l: x.tytul || x.sciezka, v: `${liczba(x.odslony)}` }))} />
        <Tabela tytul="Najczęściej oglądane strony" wiersze={(d?.strony ?? []).map((x) => ({ l: x.tytul, v: `${liczba(x.odslony)}` }))} />
        <Tabela tytul="Kluczowe zdarzenia" wiersze={(d?.zdarzenia ?? []).map((x) => ({ l: x.nazwa, v: liczba(x.liczba) }))} />
      </div>

      {/* Urządzenia */}
      <section className="mt-6 border border-linia bg-white p-6">
        <h2 className="mb-4 text-[16px] font-bold">Urządzenia</h2>
        <div className="flex flex-col gap-3">
          {(d?.urzadzenia ?? []).map((u) => {
            const etyk = u.typ === "mobile" ? "Telefon" : u.typ === "desktop" ? "Komputer" : u.typ === "tablet" ? "Tablet" : u.typ;
            return (
              <div key={u.typ}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium">{etyk}</span>
                  <span className="text-ink-2 tabular-nums">{liczba(u.uzytkownicy)}</span>
                </div>
                <div className="h-2.5 w-full bg-szary">
                  <div className="h-full bg-[oklch(66%_0.10_250)]" style={{ width: `${(u.uzytkownicy / maxUrzadz) * 100}%` }} />
                </div>
              </div>
            );
          })}
          {(d?.urzadzenia ?? []).length === 0 ? <p className="text-[13px] text-ink-2">Brak danych.</p> : null}
        </div>
      </section>

      <p className="mt-6 text-[12px] text-ink-2">
        Dane pochodzą wprost z GA4 (ostatnie 28 dni) i są zbierane po zgodzie użytkownika na cookies. Odświeżają się przy każdym wejściu na tę stronę.
      </p>
    </div>
  );
}
