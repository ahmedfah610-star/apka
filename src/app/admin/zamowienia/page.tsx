"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";

interface Pozycja {
  id: string;
  nazwa: string;
  cena: number;
  ilosc: number;
  rozmiar?: string;
}
interface Klient {
  imie?: string;
  email?: string;
  telefon?: string;
  adres?: string;
  miasto?: string;
  kod?: string;
  paczkomat?: string;
  punkt?: string;
  punktOpis?: string;
}
interface Zamowienie {
  id: string;
  data: string;
  pozycje: Pozycja[];
  suma: number;
  dostawa: number;
  razem: number;
  metoda: string;
  klient: Klient;
  status: string;
}

const STATUSY: { key: string; label: string; klasa: string }[] = [
  { key: "nowe", label: "Nowe", klasa: "bg-[oklch(90%_0.05_250)] text-[oklch(40%_0.13_250)]" },
  { key: "oczekuje_na_platnosc", label: "Oczekuje na płatność", klasa: "bg-[oklch(92%_0.07_85)] text-[oklch(45%_0.12_75)]" },
  { key: "oplacone", label: "Opłacone", klasa: "bg-[oklch(90%_0.07_150)] text-[oklch(42%_0.13_150)]" },
  { key: "wyslane", label: "Wysłane", klasa: "bg-[oklch(88%_0.02_250)] text-ink" },
  { key: "anulowane", label: "Anulowane", klasa: "bg-szary text-ink-2" },
];
const statusInfo = (k: string) => STATUSY.find((s) => s.key === k) ?? STATUSY[0];

export default function AdminZamowienia() {
  const [lista, setLista] = useState<Zamowienie[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [filtr, setFiltr] = useState<string>("wszystkie");
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);

  const odswiez = async () => {
    setLadowanie(true);
    try {
      const r = await fetch("/api/zamowienia");
      const d = await r.json();
      if (Array.isArray(d.items)) setLista(d.items);
    } catch {
      /* ignoruj */
    } finally {
      setLadowanie(false);
    }
  };
  useEffect(() => {
    void odswiez();
  }, []);

  const widoczne = useMemo(
    () => (filtr === "wszystkie" ? lista : lista.filter((z) => z.status === filtr)),
    [lista, filtr],
  );

  async function zmienStatus(id: string, status: string) {
    setLista((prev) => prev.map((z) => (z.id === id ? { ...z, status } : z)));
    try {
      await fetch("/api/zamowienia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      void odswiez();
    }
  }

  const liczby = useMemo(() => {
    const m: Record<string, number> = {};
    for (const z of lista) m[z.status] = (m[z.status] ?? 0) + 1;
    return m;
  }, [lista]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Zamówienia</h1>
          <p className="text-[14px] text-ink-2">{lista.length} łącznie</p>
        </div>
      </div>

      {/* Filtry statusów */}
      <div className="mb-5 flex flex-wrap gap-2">
        {[{ key: "wszystkie", label: "Wszystkie" }, ...STATUSY].map((s) => {
          const on = filtr === s.key;
          const n = s.key === "wszystkie" ? lista.length : liczby[s.key] ?? 0;
          return (
            <button
              key={s.key}
              onClick={() => setFiltr(s.key)}
              className={`border px-3 py-1.5 text-[13px] transition-colors ${on ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink hover:border-ink"}`}
            >
              {s.label} <span className={on ? "opacity-80" : "text-ink-2"}>{n}</span>
            </button>
          );
        })}
      </div>

      {ladowanie ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : widoczne.length === 0 ? (
        <div className="border border-linia bg-white px-6 py-12 text-center text-ink-2">
          <p className="text-[15px] font-semibold text-ink">Brak zamówień</p>
          <p className="mt-1 text-[13px]">Zamówienia ze sklepu pojawią się tutaj.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-linia">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-3 font-semibold">Nr / data</th>
                <th className="px-4 py-3 font-semibold">Klient</th>
                <th className="px-4 py-3 font-semibold">Kwota</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linia">
              {widoczne.map((z) => {
                const info = statusInfo(z.status);
                const szt = z.pozycje.reduce((s, p) => s + p.ilosc, 0);
                const otwarty = rozwiniety === z.id;
                return (
                  <Fragment key={z.id}>
                    <tr className="bg-white align-middle">
                      <td className="px-4 py-3">
                        <span className="block font-semibold">#{z.id.slice(0, 8)}</span>
                        <span className="text-[12px] text-ink-2">
                          {new Date(z.data).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block leading-tight">{z.klient?.imie || "—"}</span>
                        <span className="text-[12px] text-ink-2">{z.klient?.email || ""}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{formatCena(z.razem)} zł</span>
                        <span className="block text-[12px] text-ink-2">{szt} szt.</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={z.status}
                          onChange={(e) => void zmienStatus(z.id, e.target.value)}
                          className={`border-0 px-2.5 py-1 text-[12px] font-semibold outline-none ${info.klasa}`}
                        >
                          {STATUSY.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setRozwiniety((r) => (r === z.id ? null : z.id))}
                          className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent"
                        >
                          {otwarty ? "Zwiń" : "Szczegóły"}
                        </button>
                      </td>
                    </tr>
                    {otwarty ? (
                      <tr className="bg-szary/40">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_260px]">
                            <div>
                              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Produkty</p>
                              <div className="flex flex-col gap-1.5">
                                {z.pozycje.map((p, i) => (
                                  <div key={i} className="flex justify-between text-[13.5px]">
                                    <span>
                                      {p.nazwa}
                                      {p.rozmiar ? <span className="text-ink-2"> · rozm. {p.rozmiar}</span> : null}
                                      <span className="text-ink-2"> × {p.ilosc}</span>
                                    </span>
                                    <span className="font-medium">{formatCena(p.cena * p.ilosc)} zł</span>
                                  </div>
                                ))}
                                <div className="mt-1 flex justify-between border-t border-linia pt-1.5 text-[13px] text-ink-2">
                                  <span>Dostawa: {z.metoda}</span>
                                  <span>{z.dostawa === 0 ? "gratis" : `${formatCena(z.dostawa)} zł`}</span>
                                </div>
                                <div className="flex justify-between text-[14px] font-bold">
                                  <span>Razem</span>
                                  <span>{formatCena(z.razem)} zł</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Dostawa</p>
                              <p className="text-[13.5px] leading-relaxed">
                                <strong>{z.klient?.imie || "—"}</strong>
                                <br />
                                {z.klient?.email || ""}
                                {z.klient?.telefon ? (
                                  <>
                                    <br />
                                    {z.klient.telefon}
                                  </>
                                ) : null}
                                <br />
                                {z.klient?.paczkomat
                                  ? `Paczkomat: ${z.klient.paczkomat}`
                                  : z.klient?.punkt
                                  ? `Punkt: ${z.klient.punkt}${z.klient?.punktOpis ? ` — ${z.klient.punktOpis}` : ""}`
                                  : [z.klient?.adres, [z.klient?.kod, z.klient?.miasto].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
