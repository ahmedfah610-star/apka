"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Produkt } from "@/data/produkty";

// Panel „Magazyn" — maksymalnie prosty edytor ilości sztuk. Jeden produkt naraz,
// wielkie przyciski − i +, duży przycisk ZAPISZ. Pomyślany dla osób nietechnicznych.

/* eslint-disable @next/next/no-img-element */

type Stany = Record<string, number>;

export default function MagazynPage() {
  const [produkty, setProdukty] = useState<Produkt[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad, setBlad] = useState<string | null>(null);
  const [szukaj, setSzukaj] = useState("");
  const [idx, setIdx] = useState(0);

  // Lokalny, edytowalny stan bieżącego produktu.
  const [stany, setStany] = useState<Stany>({});
  const [stanLaczny, setStanLaczny] = useState(0); // dla produktów bez rozmiarów
  const [brudny, setBrudny] = useState(false);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [zapisano, setZapisano] = useState(false);

  useEffect(() => {
    fetch("/api/admin/produkty")
      .then((r) => r.json())
      .then((d) => setProdukty(Array.isArray(d.items) ? d.items : []))
      .catch(() => setBlad("Nie udało się wczytać produktów."))
      .finally(() => setLadowanie(false));
  }, []);

  // Lista po filtrze wyszukiwania.
  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    if (!q) return produkty;
    return produkty.filter((p) => (p.nazwa ?? "").toLowerCase().includes(q));
  }, [produkty, szukaj]);

  const produkt: Produkt | undefined = widoczne[idx];
  const rozmiary = produkt?.rozmiary ?? [];
  const maRozmiary = rozmiary.length > 0;

  // Reset indeksu, gdy zmienia się filtr.
  useEffect(() => {
    setIdx(0);
  }, [szukaj]);

  // Wczytaj stany bieżącego produktu do lokalnego stanu edycji.
  useEffect(() => {
    if (!produkt) return;
    const sr = (produkt.stanRozmiary ?? {}) as Stany;
    const init: Stany = {};
    for (const r of produkt.rozmiary ?? []) init[r] = Number(sr[r] ?? 0);
    setStany(init);
    setStanLaczny(Number(produkt.stan ?? 0));
    setBrudny(false);
    setZapisano(false);
  }, [produkt]);

  const razem = maRozmiary ? Object.values(stany).reduce((s, v) => s + (Number(v) || 0), 0) : stanLaczny;

  const zmien = (rozmiar: string, delta: number) => {
    setStany((prev) => {
      const teraz = Number(prev[rozmiar] ?? 0);
      const nowa = Math.max(0, Math.min(999, teraz + delta));
      return { ...prev, [rozmiar]: nowa };
    });
    setBrudny(true);
    setZapisano(false);
  };
  const ustaw = (rozmiar: string, wartosc: string) => {
    const n = Math.max(0, Math.min(999, parseInt(wartosc.replace(/\D/g, ""), 10) || 0));
    setStany((prev) => ({ ...prev, [rozmiar]: n }));
    setBrudny(true);
    setZapisano(false);
  };
  const zmienLaczny = (delta: number) => {
    setStanLaczny((t) => Math.max(0, Math.min(9999, t + delta)));
    setBrudny(true);
    setZapisano(false);
  };
  const ustawLaczny = (wartosc: string) => {
    setStanLaczny(Math.max(0, Math.min(9999, parseInt(wartosc.replace(/\D/g, ""), 10) || 0)));
    setBrudny(true);
    setZapisano(false);
  };

  const zapisz = useCallback(async (): Promise<boolean> => {
    if (!produkt) return false;
    setZapisywanie(true);
    setBlad(null);
    try {
      const zmiany = maRozmiary ? { stanRozmiary: stany } : { stan: stanLaczny };
      const r = await fetch("/api/admin/produkty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: produkt.id, zmiany }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.blad || "Błąd zapisu");
      // Zaktualizuj kopię w pamięci, żeby licznik/„zapisano" był spójny.
      setProdukty((prev) =>
        prev.map((p) =>
          p.id === produkt.id
            ? { ...p, stanRozmiary: maRozmiary ? { ...stany } : p.stanRozmiary, stan: razem }
            : p,
        ),
      );
      setBrudny(false);
      setZapisano(true);
      return true;
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Błąd zapisu");
      return false;
    } finally {
      setZapisywanie(false);
    }
  }, [produkt, maRozmiary, stany, stanLaczny, razem]);

  // Nawigacja z automatycznym zapisem niezapisanych zmian (żeby nic nie zginęło).
  const idzDo = useCallback(
    async (nowy: number) => {
      const cel = Math.max(0, Math.min(widoczne.length - 1, nowy));
      if (cel === idx) return;
      if (brudny) {
        const ok = await zapisz();
        if (!ok) return; // nie przechodź, jeśli zapis się nie udał
      }
      setIdx(cel);
    },
    [widoczne.length, idx, brudny, zapisz],
  );

  if (ladowanie) {
    return <p className="py-20 text-center text-[18px] text-ink-2">Wczytuję produkty…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight md:text-[30px]">Magazyn — ilości sztuk</h1>
        <p className="mt-1 text-[15px] text-ink-2">
          Ustaw ile masz sztuk każdego rozmiaru. Klikaj <b>−</b> i <b>+</b>, a potem <b>ZAPISZ</b>.
        </p>
      </div>

      {/* Wyszukiwarka */}
      <div className="mb-5">
        <input
          value={szukaj}
          onChange={(e) => setSzukaj(e.target.value)}
          placeholder="Szukaj produktu po nazwie…"
          className="w-full rounded-xl border-2 border-linia bg-white px-4 py-3.5 text-[17px] outline-none focus:border-akcent"
        />
      </div>

      {widoczne.length === 0 ? (
        <p className="py-16 text-center text-[18px] text-ink-2">Brak produktów dla „{szukaj}".</p>
      ) : produkt ? (
        <>
          {/* Pasek nawigacji góra */}
          <NawigacjaPasek
            idx={idx}
            ile={widoczne.length}
            wstecz={() => idzDo(idx - 1)}
            dalej={() => idzDo(idx + 1)}
          />

          {/* Karta produktu */}
          <div className="mt-4 rounded-2xl border-2 border-linia bg-white p-5 md:p-7">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
              <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-linia bg-white">
                {produkt.zdjecie ? (
                  <img src={produkt.zdjecie} alt={produkt.nazwa} className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="text-[13px] text-ink-2">brak zdjęcia</span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                <h2 className="text-[20px] font-bold leading-snug md:text-[22px]">{produkt.nazwa}</h2>
                <p className="mt-1 text-[15px] text-ink-2">
                  {produkt.cena?.toFixed(2).replace(".", ",")} zł
                  {produkt.kolor ? <> · {produkt.kolor}</> : null}
                </p>
                <p className="mt-3 inline-block rounded-full bg-tlo px-4 py-1.5 text-[16px] font-semibold">
                  Razem na stanie: {razem} szt.
                </p>
              </div>
            </div>

            {/* Rozmiary — steppery */}
            <div className="mt-6 flex flex-col gap-3">
              {maRozmiary ? (
                rozmiary.map((r) => (
                  <Wiersz
                    key={r}
                    etykieta={`Rozmiar ${r}`}
                    wartosc={Number(stany[r] ?? 0)}
                    onMinus={() => zmien(r, -1)}
                    onPlus={() => zmien(r, +1)}
                    onWpis={(v) => ustaw(r, v)}
                  />
                ))
              ) : (
                <Wiersz
                  etykieta="Liczba sztuk"
                  wartosc={stanLaczny}
                  onMinus={() => zmienLaczny(-1)}
                  onPlus={() => zmienLaczny(+1)}
                  onWpis={(v) => ustawLaczny(v)}
                />
              )}
            </div>

            {/* Zapis */}
            <div className="mt-7 flex flex-col items-center gap-3">
              <button
                onClick={() => zapisz()}
                disabled={zapisywanie || !brudny}
                className={`w-full rounded-xl px-6 py-4 text-[19px] font-bold tracking-wide text-white transition-colors ${
                  brudny ? "bg-akcent hover:bg-ink" : "bg-[oklch(75%_0.03_150)]"
                } disabled:cursor-default`}
              >
                {zapisywanie ? "ZAPISUJĘ…" : brudny ? "ZAPISZ ZMIANY" : zapisano ? "ZAPISANO ✓" : "ZAPISANE"}
              </button>
              {blad ? <p className="text-[15px] font-semibold text-akcent">{blad}</p> : null}
              {zapisano && !brudny ? (
                <p className="text-[15px] font-semibold text-[oklch(52%_0.13_150)]">Zapisano ✓</p>
              ) : brudny ? (
                <p className="text-[14px] text-ink-2">Masz niezapisane zmiany.</p>
              ) : null}
            </div>
          </div>

          {/* Pasek nawigacji dół */}
          <div className="mt-4">
            <NawigacjaPasek
              idx={idx}
              ile={widoczne.length}
              wstecz={() => idzDo(idx - 1)}
              dalej={() => idzDo(idx + 1)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

// Pasek: ◀ Poprzedni | „12 z 541" | Następny ▶
function NawigacjaPasek({
  idx,
  ile,
  wstecz,
  dalej,
}: {
  idx: number;
  ile: number;
  wstecz: () => void;
  dalej: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={wstecz}
        disabled={idx <= 0}
        className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-3 text-[16px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-ink"
      >
        ◀ Poprzedni
      </button>
      <span className="text-[16px] font-semibold text-ink-2">
        {idx + 1} <span className="text-ink-2">z</span> {ile}
      </span>
      <button
        onClick={dalej}
        disabled={idx >= ile - 1}
        className="flex items-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-3 text-[16px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-ink"
      >
        Następny ▶
      </button>
    </div>
  );
}

// Jeden wiersz rozmiaru: etykieta …… [ − ] [ liczba ] [ + ]
function Wiersz({
  etykieta,
  wartosc,
  onMinus,
  onPlus,
  onWpis,
}: {
  etykieta: string;
  wartosc: number;
  onMinus: () => void;
  onPlus: () => void;
  onWpis: (v: string) => void;
}) {
  const brak = wartosc === 0;
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${
        brak ? "border-linia bg-tlo/40" : "border-linia bg-white"
      }`}
    >
      <span className="text-[18px] font-semibold">
        {etykieta}
        {brak ? <span className="ml-2 text-[13px] font-normal text-akcent">brak</span> : null}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onMinus}
          aria-label="Zmniejsz"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink text-[26px] font-bold leading-none text-ink transition-colors hover:bg-ink hover:text-white"
        >
          −
        </button>
        <input
          value={wartosc}
          onChange={(e) => onWpis(e.target.value)}
          inputMode="numeric"
          className="w-16 rounded-lg border-2 border-linia py-2 text-center text-[22px] font-bold outline-none focus:border-akcent"
        />
        <button
          onClick={onPlus}
          aria-label="Zwiększ"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink text-[26px] font-bold leading-none text-ink transition-colors hover:bg-ink hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
