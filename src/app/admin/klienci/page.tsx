"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";

interface Pozycja { id: string; nazwa: string; cena: number; ilosc: number; rozmiar?: string }
interface Klient { imie?: string; email?: string; telefon?: string }
interface Zamowienie {
  id: string;
  data: string;
  pozycje: Pozycja[];
  razem: number;
  status: string;
  klient: Klient;
}

interface Wpis {
  email: string;
  imie: string;
  telefon: string;
  liczba: number;
  wydane: number;
  sztuk: number;
  ostatnie: string;
}

const ZREALIZOWANE = ["oplacone", "wyslane"];
const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

export default function AdminKlienci() {
  const [lista, setLista] = useState<Zamowienie[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [szukaj, setSzukaj] = useState("");

  useEffect(() => {
    fetch("/api/zamowienia")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.items)) setLista(d.items); })
      .catch(() => {})
      .finally(() => setLadowanie(false));
  }, []);

  const klienci = useMemo(() => {
    const mapa = new Map<string, Wpis>();
    for (const z of lista) {
      const email = (z.klient?.email || "").trim().toLowerCase();
      if (!email) continue;
      const w = mapa.get(email) ?? { email, imie: "", telefon: "", liczba: 0, wydane: 0, sztuk: 0, ostatnie: z.data };
      w.liczba += 1;
      if (ZREALIZOWANE.includes(z.status)) {
        w.wydane += z.razem;
        w.sztuk += z.pozycje.reduce((s, p) => s + p.ilosc, 0);
      }
      if (!w.imie && z.klient?.imie) w.imie = z.klient.imie;
      if (!w.telefon && z.klient?.telefon) w.telefon = z.klient.telefon;
      if (new Date(z.data).getTime() > new Date(w.ostatnie).getTime()) w.ostatnie = z.data;
      mapa.set(email, w);
    }
    return [...mapa.values()].sort((a, b) => b.wydane - a.wydane || b.liczba - a.liczba);
  }, [lista]);

  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    if (!q) return klienci;
    return klienci.filter((k) => k.email.includes(q) || k.imie.toLowerCase().includes(q) || k.telefon.includes(q));
  }, [klienci, szukaj]);

  const sumaObrotu = klienci.reduce((s, k) => s + k.wydane, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Klienci</h1>
          <p className="text-[14px] text-ink-2">
            {klienci.length} klientów · {formatCena(sumaObrotu)} zł łącznego obrotu
          </p>
        </div>
      </div>

      <input
        className="mb-4 w-full max-w-sm border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink"
        placeholder="Szukaj po e-mailu, imieniu, telefonie…"
        value={szukaj}
        onChange={(e) => setSzukaj(e.target.value)}
      />

      {ladowanie ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : widoczne.length === 0 ? (
        <div className="border border-linia bg-white px-6 py-12 text-center text-ink-2">
          <p className="text-[15px] font-semibold text-ink">Brak klientów</p>
          <p className="mt-1 text-[13px]">Gdy pojawią się zamówienia, klienci znajdą się tutaj.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-linia">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-3 font-semibold">Klient</th>
                <th className="px-4 py-3 font-semibold">Kontakt</th>
                <th className="px-4 py-3 font-semibold">Zamówienia</th>
                <th className="px-4 py-3 font-semibold">Wydane</th>
                <th className="px-4 py-3 font-semibold">Ostatnie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linia">
              {widoczne.map((k) => (
                <tr key={k.email} className="bg-white align-middle">
                  <td className="px-4 py-3">
                    <span className="block font-semibold leading-tight">{k.imie || "—"}</span>
                    {k.wydane > 0 && k.liczba > 1 ? <span className="text-[11px] font-semibold text-akcent">stały klient</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[13px]">
                    <a href={`mailto:${k.email}`} className="block text-ink underline underline-offset-2 hover:text-akcent">{k.email}</a>
                    {k.telefon ? <span className="block text-ink-2">{k.telefon}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{k.liczba}</span>
                    <span className="block text-[12px] text-ink-2">{k.sztuk} szt. kupionych</span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCena(k.wydane)} zł</td>
                  <td className="px-4 py-3 text-[13px] text-ink-2">{DATA_PL(k.ostatnie)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-5 max-w-2xl text-[12px] leading-relaxed text-ink-2">
        Lista powstaje automatycznie z zamówień (grupowanie po e-mailu). „Wydane" liczy tylko
        zamówienia opłacone i wysłane. Kliknij e-mail, aby napisać do klienta.
      </p>
    </div>
  );
}
