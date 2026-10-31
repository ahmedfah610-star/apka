"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SynchronizacjaStanow } from "@/components/SynchronizacjaStanow";
import { zdjecie } from "@/lib/zdjecia";
import type { Produkt } from "@/data/produkty";
import type { RaportStanow } from "@/lib/allegroStany";

type Zakladka = "konczace" | "wyprzedane" | "reczne" | "allegro";
const MALO = 2; // „kończy się" = 1–2 szt.

/** Rozmiary z ilościami (produkt bez rozmiarów = jeden wpis „—"). */
function rozmiaryZeStanem(p: Produkt): { rozmiar: string; ilosc: number }[] {
  if (p.rozmiary?.length && p.stanRozmiary) return p.rozmiary.map((r) => ({ rozmiar: r, ilosc: p.stanRozmiary?.[r] ?? 0 }));
  return typeof p.stan === "number" ? [{ rozmiar: "—", ilosc: p.stan }] : [];
}

// Kontrola stanów: źródłem ilości jest Allegro (codzienna synchronizacja) — tutaj przegląd tego,
// co się kończy, co jest wyprzedane, co nie ma pary na Allegro i czego brakuje w sklepie.
export default function KontrolaStanow() {
  const [produkty, setProdukty] = useState<Produkt[] | null>(null);
  const [zAllegro, setZAllegro] = useState<Set<string> | null>(null);
  const [raport, setRaport] = useState<RaportStanow | null>(null);
  const [zakladka, setZakladka] = useState<Zakladka>("konczace");
  const [ukrywanie, setUkrywanie] = useState<string | null>(null);

  const wczytaj = () => {
    fetch("/api/admin/produkty")
      .then((r) => r.json())
      .then((d) => setProdukty(Array.isArray(d.items) ? d.items : []))
      .catch(() => setProdukty([]));
  };
  useEffect(() => {
    wczytaj();
    fetch("/api/admin/allegro?powiazane=1")
      .then((r) => r.json())
      .then((d) => setZAllegro(new Set(Array.isArray(d.ids) ? d.ids : [])))
      .catch(() => setZAllegro(new Set()));
    fetch("/api/admin/allegro?synchronizacja=1")
      .then((r) => r.json())
      .then((d) => setRaport(d.raport ?? null))
      .catch(() => {});
  }, []);

  const widoczne = useMemo(() => (produkty ?? []).filter((p) => !p.ukryty), [produkty]);

  const konczace = useMemo(() => {
    const w: { p: Produkt; rozmiar: string; ilosc: number }[] = [];
    for (const p of widoczne) for (const r of rozmiaryZeStanem(p)) if (r.ilosc > 0 && r.ilosc <= MALO) w.push({ p, ...r });
    return w.sort((a, b) => a.ilosc - b.ilosc || a.p.nazwa.localeCompare(b.p.nazwa, "pl"));
  }, [widoczne]);

  const wyprzedane = useMemo(
    () => widoczne.filter((p) => { const r = rozmiaryZeStanem(p); return r.length > 0 && r.every((x) => x.ilosc <= 0); }),
    [widoczne],
  );
  const reczne = useMemo(() => (zAllegro ? widoczne.filter((p) => !zAllegro.has(p.id)) : []), [widoczne, zAllegro]);
  const bezPary = raport?.niedopasowaneLista ?? [];

  async function ukryj(p: Produkt) {
    if (!confirm(`Ukryć „${p.nazwa}” w sklepie? Możesz go później przywrócić na liście produktów.`)) return;
    setUkrywanie(p.id);
    await fetch("/api/admin/produkty", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, ukryty: true }) }).catch(() => {});
    setUkrywanie(null);
    wczytaj();
  }

  const kafle: { k: Zakladka; ile: number; tytul: string; opis: string }[] = [
    { k: "konczace", ile: konczace.length, tytul: "Kończy się", opis: `rozmiary z 1–${MALO} szt.` },
    { k: "wyprzedane", ile: wyprzedane.length, tytul: "Wyprzedane", opis: "widoczne, 0 szt. we wszystkich rozmiarach" },
    { k: "allegro", ile: raport?.niedopasowane ?? 0, tytul: "Z Allegro, brak w sklepie", opis: "oferty bez produktu w sklepie" },
    { k: "reczne", ile: reczne.length, tytul: "Spoza Allegro", opis: "stany ustawiasz ręcznie" },
  ];

  const miniatura = (p: Produkt) =>
    p.zdjecie ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={zdjecie(p.zdjecie, "s128")} alt="" className="h-12 w-12 shrink-0 rounded-md border border-linia bg-white object-contain" />
    ) : (
      <span className="h-12 w-12 shrink-0 rounded-md bg-szary" />
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Kontrola stanów</h1>
        <p className="max-w-2xl text-[14px] text-ink-2">
          Ilości sztuk w sklepie ustawia codzienna synchronizacja z Allegro — sprzedaż i dostawy towaru wpisuj na Allegro. Tu widzisz, co wymaga uwagi.
        </p>
      </div>

      <div className="mb-6">
        <SynchronizacjaStanow />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kafle.map((t) => (
          <button
            key={t.k}
            onClick={() => setZakladka(t.k)}
            className={`rounded-xl border bg-white p-4 text-left transition-colors ${zakladka === t.k ? "border-ink ring-1 ring-ink" : "border-linia hover:border-ink"}`}
          >
            <span className="block text-[26px] font-bold leading-none tabular-nums">{produkty === null ? "…" : t.ile}</span>
            <span className="mt-1.5 block text-[13.5px] font-semibold">{t.tytul}</span>
            <span className="block text-[12px] text-ink-2">{t.opis}</span>
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-linia bg-white p-4 md:p-5">
        {produkty === null ? (
          <p className="text-[13px] text-ink-2">Wczytywanie…</p>
        ) : zakladka === "konczace" ? (
          konczace.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-ink-2">Nic się nie kończy.</p>
          ) : (
            <div className="flex flex-col divide-y divide-linia">
              {konczace.map(({ p, rozmiar, ilosc }) => (
                <div key={`${p.id}-${rozmiar}`} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                  {miniatura(p)}
                  <span className="min-w-0 flex-1">
                    <a href={`/produkty/${p.id}`} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-ink no-underline hover:underline">{p.nazwa}</a>
                    <span className="text-ink-2">{p.kolor ? `${p.kolor} · ` : ""}rozmiar <strong className="text-ink">{rozmiar}</strong></span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${ilosc === 1 ? "bg-[oklch(93%_0.05_25)] text-cena" : "bg-szary text-ink"}`}>{ilosc} szt.</span>
                </div>
              ))}
            </div>
          )
        ) : zakladka === "wyprzedane" ? (
          wyprzedane.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-ink-2">Brak wyprzedanych produktów widocznych w sklepie.</p>
          ) : (
            <>
              <p className="mb-3 text-[12.5px] text-ink-2">
                Wyprzedane produkty są widoczne z przyciskiem „Powiadom o dostępności”. Jeśli towar nie wróci — ukryj, żeby nie zaśmiecał listy.
              </p>
              <div className="flex flex-col divide-y divide-linia">
                {wyprzedane.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                    {miniatura(p)}
                    <span className="min-w-0 flex-1">
                      <a href={`/produkty/${p.id}`} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-ink no-underline hover:underline">{p.nazwa}</a>
                      <span className="text-ink-2">{(p.rozmiary ?? []).join(", ") || "bez rozmiarów"}</span>
                    </span>
                    <button onClick={() => void ukryj(p)} disabled={ukrywanie === p.id} className="shrink-0 rounded-lg border border-linia-2 px-3 py-1.5 text-[12.5px] font-semibold hover:border-ink disabled:opacity-50">
                      {ukrywanie === p.id ? "…" : "Ukryj"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )
        ) : zakladka === "allegro" ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] text-ink-2">
                Aktywne oferty z Allegro, których nie ma w sklepie (ostatnia synchronizacja{raport ? `: ${new Date(raport.czas).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}` : ""}).
              </p>
              <Link href="/admin/import" className="rounded-lg bg-ink px-3.5 py-2 text-[13px] font-semibold text-tlo no-underline hover:bg-akcent">
                Pobierz nowe z Allegro →
              </Link>
            </div>
            {bezPary.length === 0 ? (
              <p className="py-6 text-center text-[13.5px] text-ink-2">Wszystkie oferty z Allegro są w sklepie.</p>
            ) : (
              <div className="flex flex-col divide-y divide-linia">
                {bezPary.map((o) => (
                  <div key={o.oferta} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                    <span className="min-w-0 truncate">{o.nazwa}</span>
                    <a href={`https://allegro.pl/oferta/${o.oferta}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[12.5px] text-ink-2 underline underline-offset-2">
                      Allegro →
                    </a>
                  </div>
                ))}
                {(raport?.niedopasowane ?? 0) > bezPary.length ? (
                  <p className="pt-2 text-[12px] text-ink-2">…i {(raport?.niedopasowane ?? 0) - bezPary.length} więcej.</p>
                ) : null}
              </div>
            )}
          </>
        ) : reczne.length === 0 ? (
          <p className="py-6 text-center text-[13.5px] text-ink-2">Wszystkie produkty w sklepie są powiązane z Allegro — stany ustawia synchronizacja.</p>
        ) : (
          <>
            <p className="mb-3 text-[12.5px] text-ink-2">Tych produktów nie ma na Allegro — ich ilości synchronizacja nie zmienia. Ustaw je ręcznie.</p>
            <div className="flex flex-col divide-y divide-linia">
              {reczne.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 text-[13.5px]">
                  {miniatura(p)}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.nazwa}</span>
                    <span className="text-ink-2">{rozmiaryZeStanem(p).map((r) => `${r.rozmiar}: ${r.ilosc}`).join(" · ") || "brak danych o stanie"}</span>
                  </span>
                  <Link href={`/admin/magazyn/edycja?id=${encodeURIComponent(p.id)}`} className="shrink-0 rounded-lg border border-linia-2 px-3 py-1.5 text-[12.5px] font-semibold text-ink no-underline hover:border-ink">
                    Zmień ilość
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <p className="mt-4 text-[12.5px] text-ink-2">
        Potrzebujesz zmienić ilość wyjątkowo (np. do najbliższej synchronizacji)?{" "}
        <Link href="/admin/magazyn/edycja" className="text-ink underline underline-offset-2">Ręczna zmiana ilości</Link>
      </p>
    </div>
  );
}
