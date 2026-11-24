"use client";

import { useMemo, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";
import { kwotaZwrotu, opisPozycji, type PozycjaZamowienia, type WpisBraku } from "@/lib/brakTowaru";

// Zamówienie → „Brak towaru”: zaznaczasz brakujące produkty, sklep liczy kwotę zwrotu (z rabatem z kodu)
// i wysyła klientowi maila z przeprosinami, informacją o pieniądzach i kodem NADROBIMY10.
export function BrakTowaru({
  z,
  onWyslano,
}: {
  z: { id: string; pozycje: PozycjaZamowienia[]; suma: number; rabat?: number; razem: number; klient: { email?: string; braki?: WpisBraku[] } };
  onWyslano: (braki: WpisBraku[]) => void;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [wybrane, setWybrane] = useState<number[]>([]);
  const [kwotaRecznie, setKwotaRecznie] = useState<string>("");
  const [zwrot, setZwrot] = useState<"zwrocone" | "konto">("zwrocone");
  const [stan, setStan] = useState<string>("");

  const wyliczone = useMemo(() => kwotaZwrotu(z, wybrane), [z, wybrane]);
  const kwota = kwotaRecznie.trim() ? Number(kwotaRecznie.replace(",", ".")) : wyliczone.kwota;
  const braki = z.klient.braki ?? [];

  function przelacz(i: number) {
    setKwotaRecznie("");
    setWybrane((w) => (w.includes(i) ? w.filter((x) => x !== i) : [...w, i].sort((a, b) => a - b)));
  }

  async function wyslij(proba = false) {
    if (!wybrane.length) return setStan("Zaznacz, których produktów brakuje.");
    if (!Number.isFinite(kwota) || kwota <= 0) return setStan("Podaj poprawną kwotę zwrotu.");
    if (proba) {
      setStan("…");
      try {
        const r = await fetch("/api/zamowienia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: z.id, akcja: "brak-towaru", pozycje: wybrane, kwota, zwrot, proba: true }),
        });
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; do?: string };
        setStan(r.ok && d.ok ? `Próba wysłana na ${d.do} ✓ — klient nic nie dostał.` : d.blad || "Nie udało się wysłać próby.");
      } catch {
        setStan("Błąd połączenia.");
      }
      return;
    }
    const coZPieniedzmi = zwrot === "zwrocone" ? `że ${formatCena(kwota)} zł JUŻ zwróciłeś w Przelewy24` : `prośbę o numer konta do zwrotu ${formatCena(kwota)} zł`;
    if (!confirm(`Wysłać na ${z.klient.email} maila o braku towaru (${wybrane.length} poz.) z informacją, ${coZPieniedzmi}, i kodem NADROBIMY10?`)) return;
    setStan("…");
    try {
      const r = await fetch("/api/zamowienia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: z.id, akcja: "brak-towaru", pozycje: wybrane, kwota, zwrot }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; braki?: WpisBraku[] };
      if (!r.ok || !d.ok) return setStan(d.blad || "Nie udało się wysłać.");
      onWyslano(d.braki ?? []);
      setStan("Wysłano ✓");
      setWybrane([]);
      setKwotaRecznie("");
    } catch {
      setStan("Błąd połączenia.");
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-linia px-3 py-3">
      <button type="button" onClick={() => setOtwarte((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="text-[12px] font-bold uppercase tracking-wide text-ink-2">Brak towaru — mail do klienta</span>
        <span className="text-[13px] text-ink-2">{otwarte ? "▲" : "▼"}</span>
      </button>
      {braki.length ? (
        <ul className="mt-1.5 space-y-0.5 text-[12px] text-ink-2">
          {braki.map((b, i) => (
            <li key={i}>
              ✓ Wysłano {new Date(b.czas).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}: {b.pozycje.join("; ")} —{" "}
              {formatCena(b.kwota)} zł ({b.zwrot === "zwrocone" ? "zwrócone" : "prośba o numer konta"})
            </li>
          ))}
        </ul>
      ) : null}
      {otwarte ? (
        !z.klient.email ? (
          <p className="mt-2 text-[12.5px] text-ink-2">Brak adresu e-mail — zadzwoń do klienta.</p>
        ) : (
          <div className="mt-2 space-y-2.5 text-[13px]">
            <p className="text-[12.5px] leading-snug text-ink-2">
              1. Najpierw zrób zwrot w Przelewy24 (albo przelew). 2. Zaznacz brakujące produkty. 3. Wyślij — klient dostanie przeprosiny, informację o
              pieniądzach i kod NADROBIMY10 (−10%).
            </p>
            <div className="space-y-1.5">
              {z.pozycje.map((p, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={wybrane.includes(i)} onChange={() => przelacz(i)} className="mt-0.5 h-4 w-4" />
                  <span>
                    {opisPozycji(p)} · {p.ilosc} szt. · {formatCena(p.cena * p.ilosc)} zł
                  </span>
                </label>
              ))}
            </div>
            <label className="block">
              <span className="text-[12px] text-ink-2">
                Kwota zwrotu {wybrane.length ? (wyliczone.calosc ? "(całe zamówienie z dostawą)" : "(z uwzględnieniem rabatu z kodu)") : ""}
              </span>
              <input
                inputMode="decimal"
                value={kwotaRecznie || (wybrane.length ? formatCena(wyliczone.kwota) : "")}
                onChange={(e) => setKwotaRecznie(e.target.value)}
                placeholder="zaznacz produkty"
                className="mt-0.5 w-full rounded-md border border-linia-2 bg-white px-2.5 py-2 text-[16px] outline-none focus:border-ink md:text-[13px]"
              />
            </label>
            <div className="space-y-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={zwrot === "zwrocone"} onChange={() => setZwrot("zwrocone")} />
                Pieniądze już zwrócone w Przelewy24
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" checked={zwrot === "konto"} onChange={() => setZwrot("konto")} />
                Poproś klienta o numer konta (zwrot przelewem)
              </label>
            </div>
            <button
              onClick={() => void wyslij()}
              disabled={stan === "…" || !wybrane.length}
              className="w-full rounded-lg bg-ink px-3.5 py-2.5 text-[13px] font-bold text-tlo hover:bg-akcent disabled:opacity-50 md:py-2 md:text-[12.5px]"
            >
              {stan === "…" ? "Wysyłanie…" : "Wyślij maila o braku towaru"}
            </button>
            <button
              onClick={() => void wyslij(true)}
              disabled={stan === "…" || !wybrane.length}
              className="w-full rounded-lg border border-linia-2 px-3.5 py-2 text-[12.5px] font-semibold text-ink hover:border-ink disabled:opacity-50"
            >
              Najpierw próba na mój e-mail (klient nic nie dostanie)
            </button>
            {stan && stan !== "…" ? <p className="text-[12px] font-semibold">{stan}</p> : null}
          </div>
        )
      ) : null}
    </div>
  );
}
