"use client";

import { useEffect, useMemo, useState } from "react";

interface Subskrybent { email: string; od: string }
interface Czekajacy { id: string; produktId: string; nazwa: string | null; rozmiar: string | null; email: string; od: string }
interface Ostatnia {
  czas: string;
  wyslano: number;
  subskrybenci: number;
  produkty: string[];
  temat?: string;
  powod?: "brak_nowosci" | "brak_subskrybentow" | "blad";
}
interface Dane { subskrybenci: Subskrybent[]; ostatnia: Ostatnia | null; czekajace: Czekajacy[]; wyslanePowiadomienia: number }

const DATA = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
const DATA_GODZ = (iso: string) =>
  new Date(iso).toLocaleString("pl-PL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function pobierzCsv(wiersze: string[][], nazwa: string) {
  const csv = "﻿" + wiersze.map((w) => w.map((k) => `"${k.replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nazwa;
  a.click();
  URL.revokeObjectURL(url);
}

function Kafel({ liczba, opis }: { liczba: number | string; opis: string }) {
  return (
    <div className="rounded-xl border border-linia bg-white px-4 py-3">
      <div className="text-[24px] font-bold tabular-nums">{liczba}</div>
      <div className="text-[12.5px] text-ink-2">{opis}</div>
    </div>
  );
}

function OstatniaWysylka({ o }: { o: Ostatnia | null }) {
  if (!o) {
    return <p className="text-[13.5px] text-ink-2">Po nowych zasadach newsletter jeszcze nie ruszył — pierwszy wyjdzie w najbliższy czwartek ok. 10:00.</p>;
  }
  const kiedy = DATA_GODZ(o.czas);
  if (o.powod === "brak_nowosci")
    return <p className="text-[13.5px]">{kiedy}: <strong>nie wysłano</strong> — w ostatnim tygodniu nie doszły nowe produkty dziecięce na stanie (newsletter nie powtarza starych rzeczy).</p>;
  if (o.powod === "brak_subskrybentow") return <p className="text-[13.5px]">{kiedy}: nie wysłano — nikt nie był zapisany.</p>;
  return (
    <div className="text-[13.5px]">
      <p>
        {kiedy}: wysłano do <strong>{o.wyslano}</strong> z {o.subskrybenci} osób
        {o.powod === "blad" ? <span className="text-[oklch(50%_0.19_25)]"> — część się nie wysłała (szczegóły w zakładce Maile)</span> : " ✓"}
      </p>
      {o.temat ? <p className="mt-1 text-ink-2">Temat: „{o.temat}”</p> : null}
      {o.produkty.length ? <p className="mt-1 text-ink-2">Produkty: {o.produkty.join(", ")}</p> : null}
    </div>
  );
}

export default function AdminNewsletter() {
  const [dane, setDane] = useState<Dane | null>(null);
  const [blad, setBlad] = useState("");
  const [szukaj, setSzukaj] = useState("");
  const [usuwanie, setUsuwanie] = useState<string | null>(null);

  const odswiez = async () => {
    try {
      const r = await fetch("/api/admin/newsletter");
      const d = await r.json();
      if (d.ok) setDane(d);
      else setBlad(d.blad || "Nie udało się wczytać.");
    } catch {
      setBlad("Nie udało się wczytać.");
    }
  };
  useEffect(() => {
    void odswiez();
  }, []);

  const lista = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return (dane?.subskrybenci ?? []).filter((s) => !q || s.email.includes(q));
  }, [dane, szukaj]);
  const nowi30 = useMemo(() => (dane?.subskrybenci ?? []).filter((s) => Date.now() - +new Date(s.od) < 30 * 86400000).length, [dane]);

  async function usun(email: string) {
    if (!confirm(`Usunąć ${email} z listy newslettera? Ta osoba przestanie dostawać maile.`)) return;
    setUsuwanie(email);
    try {
      const r = await fetch(`/api/admin/newsletter?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      if ((await r.json()).ok) setDane((d) => (d ? { ...d, subskrybenci: d.subskrybenci.filter((s) => s.email !== email) } : d));
    } finally {
      setUsuwanie(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Newsletter</h1>
        <p className="text-[14px] text-ink-2">Co czwartek ok. 10:00 — nowości dziecięce z ostatniego tygodnia (tylko na stanie) i poradnik z bloga.</p>
      </div>

      {blad ? <p className="mb-4 text-[14px] text-[oklch(50%_0.19_25)]">{blad}</p> : null}
      {!dane && !blad ? <p className="text-[14px] text-ink-2">Wczytywanie…</p> : null}

      {dane ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kafel liczba={dane.subskrybenci.length} opis="zapisanych osób" />
            <Kafel liczba={nowi30} opis="nowych w 30 dni" />
            <Kafel liczba={dane.czekajace.length} opis="czeka na „znów dostępne”" />
            <Kafel liczba={dane.wyslanePowiadomienia} opis="powiadomień już wysłanych" />
          </div>

          <section className="rounded-xl border border-linia bg-white p-5">
            <h2 className="mb-2 text-[15px] font-bold">Ostatnia wysyłka</h2>
            <OstatniaWysylka o={dane.ostatnia} />
          </section>

          <section className="rounded-xl border border-linia bg-white p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold">Zapisani ({dane.subskrybenci.length})</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  value={szukaj}
                  onChange={(e) => setSzukaj(e.target.value)}
                  placeholder="Szukaj e-maila…"
                  className="w-52 rounded-lg border border-linia-2 px-3 py-2 text-[13px]"
                />
                <button
                  onClick={() => pobierzCsv([["E-mail", "Zapisany"], ...dane.subskrybenci.map((s) => [s.email, DATA(s.od)])], "newsletter-bobas-shopping.csv")}
                  disabled={!dane.subskrybenci.length}
                  className="rounded-lg border border-linia-2 px-4 py-2 text-[13px] font-semibold hover:border-ink disabled:opacity-50"
                >
                  Pobierz CSV
                </button>
              </div>
            </div>
            {lista.length === 0 ? (
              <p className="text-[13.5px] text-ink-2">{dane.subskrybenci.length ? "Brak wyników." : "Nikt jeszcze się nie zapisał."}</p>
            ) : (
              <ul className="divide-y divide-linia">
                {lista.map((s) => (
                  <li key={s.email} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{s.email}</div>
                      <div className="text-[12.5px] text-ink-2">zapisany {DATA(s.od)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[13px]">
                      <a href={`/admin/maile?q=${encodeURIComponent(s.email)}`} className="text-ink-2 underline hover:text-ink">maile</a>
                      <button onClick={() => void usun(s.email)} disabled={usuwanie === s.email} className="text-ink-2 underline hover:text-[oklch(50%_0.19_25)] disabled:opacity-50">
                        usuń
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-linia bg-white p-5">
            <h2 className="mb-1 text-[15px] font-bold">Czekają na „znów dostępne” ({dane.czekajace.length})</h2>
            <p className="mb-3 text-[13px] text-ink-2">
              Mail wyjdzie sam, gdy rozmiar wróci na stan (synchronizacja z Allegro, nowa oferta albo ręczna zmiana stanu).
            </p>
            {dane.czekajace.length === 0 ? (
              <p className="text-[13.5px] text-ink-2">Nikt teraz nie czeka.</p>
            ) : (
              <ul className="divide-y divide-linia">
                {dane.czekajace.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-[14px]">
                    <div className="min-w-0">
                      <a href={`/produkty/${c.produktId}`} target="_blank" rel="noreferrer" className="font-medium underline-offset-2 hover:underline">
                        {c.nazwa ?? c.produktId}
                      </a>
                      {c.rozmiar ? <span className="text-ink-2"> · rozm. {c.rozmiar}</span> : null}
                      <div className="truncate text-[12.5px] text-ink-2">{c.email}</div>
                    </div>
                    <span className="text-[12.5px] text-ink-2">{DATA(c.od)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
