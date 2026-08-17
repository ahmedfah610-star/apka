"use client";

import { useEffect, useState } from "react";
import { formatCena } from "@/lib/filtrowanie";

interface Kod {
  kod: string;
  typ: "procent" | "kwota";
  wartosc: number;
  minKoszyk: number;
  aktywny: boolean;
  waznyDo: string | null;
  limitUzyc: number | null;
  uzyto: number;
  createdAt: string;
}

const PUSTY = { kod: "", typ: "procent" as "procent" | "kwota", wartosc: "", minKoszyk: "", waznyDo: "", limitUzyc: "" };
const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

export default function AdminKody() {
  const [lista, setLista] = useState<Kod[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [form, setForm] = useState(PUSTY);
  const [zapis, setZapis] = useState(false);
  const [komunikat, setKomunikat] = useState("");

  const odswiez = async () => {
    setLadowanie(true);
    try {
      const r = await fetch("/api/admin/kody");
      const d = await r.json();
      if (Array.isArray(d.items)) setLista(d.items);
    } catch { /* ignoruj */ } finally { setLadowanie(false); }
  };
  useEffect(() => { void odswiez(); }, []);

  async function zapiszKod(e: React.FormEvent) {
    e.preventDefault();
    setZapis(true);
    setKomunikat("");
    try {
      const r = await fetch("/api/admin/kody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kod: form.kod,
          typ: form.typ,
          wartosc: parseFloat(form.wartosc.replace(",", ".")),
          minKoszyk: form.minKoszyk ? parseFloat(form.minKoszyk.replace(",", ".")) : 0,
          waznyDo: form.waznyDo || null,
          limitUzyc: form.limitUzyc || null,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; blad?: string; powod?: string };
      if (!r.ok || d.ok === false) {
        setKomunikat(d.powod === "brak_bazy" ? "Kody wymagają podłączonej bazy (Supabase)." : d.blad || "Nie udało się zapisać.");
        return;
      }
      setForm(PUSTY);
      setKomunikat("Kod zapisany ✓");
      await odswiez();
      setTimeout(() => setKomunikat(""), 3000);
    } finally { setZapis(false); }
  }

  async function przelacz(k: Kod) {
    setLista((prev) => prev.map((x) => (x.kod === k.kod ? { ...x, aktywny: !x.aktywny } : x)));
    try {
      await fetch("/api/admin/kody", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod: k.kod, aktywny: !k.aktywny }),
      });
    } catch { void odswiez(); }
  }

  async function usun(k: Kod) {
    if (!confirm(`Usunąć kod ${k.kod}?`)) return;
    setLista((prev) => prev.filter((x) => x.kod !== k.kod));
    try {
      await fetch("/api/admin/kody", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod: k.kod }),
      });
    } catch { void odswiez(); }
  }

  const input = "w-full border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";
  const opisRabatu = (k: Kod) => (k.typ === "procent" ? `-${k.wartosc}%` : `-${formatCena(k.wartosc)} zł`);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Kody rabatowe</h1>
        <p className="text-[14px] text-ink-2">Twórz kody procentowe lub kwotowe — klient wpisuje je w koszyku.</p>
      </div>

      {/* Nowy kod */}
      <form onSubmit={zapiszKod} className="mb-8 border border-linia bg-white p-5">
        <h2 className="mb-4 text-[15px] font-bold">Nowy kod</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={`${input} uppercase`} placeholder="KOD (np. LATO10)" value={form.kod} onChange={(e) => setForm({ ...form, kod: e.target.value.toUpperCase() })} />
          <select className={input} value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value as "procent" | "kwota" })}>
            <option value="procent">Rabat procentowy (%)</option>
            <option value="kwota">Rabat kwotowy (zł)</option>
          </select>
          <input className={input} placeholder={form.typ === "procent" ? "Ile % (np. 10)" : "Ile zł (np. 20)"} value={form.wartosc} onChange={(e) => setForm({ ...form, wartosc: e.target.value })} />
          <input className={input} placeholder="Min. koszyk zł (opcjonalnie)" value={form.minKoszyk} onChange={(e) => setForm({ ...form, minKoszyk: e.target.value })} />
          <input className={input} type="date" title="Ważny do" value={form.waznyDo} onChange={(e) => setForm({ ...form, waznyDo: e.target.value })} />
          <input className={input} placeholder="Limit użyć (opcjonalnie)" value={form.limitUzyc} onChange={(e) => setForm({ ...form, limitUzyc: e.target.value })} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={zapis} className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
            {zapis ? "ZAPISYWANIE…" : "UTWÓRZ KOD"}
          </button>
          {komunikat ? <span className="text-[13px] text-ink-2">{komunikat}</span> : null}
        </div>
      </form>

      {/* Lista kodów */}
      {ladowanie ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : lista.length === 0 ? (
        <div className="border border-linia bg-white px-6 py-12 text-center text-ink-2">
          <p className="text-[15px] font-semibold text-ink">Brak kodów</p>
          <p className="mt-1 text-[13px]">Utwórz pierwszy kod powyżej.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-linia">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-3 font-semibold">Kod</th>
                <th className="px-4 py-3 font-semibold">Rabat</th>
                <th className="px-4 py-3 font-semibold">Warunki</th>
                <th className="px-4 py-3 font-semibold">Użycia</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linia">
              {lista.map((k) => (
                <tr key={k.kod} className="bg-white align-middle">
                  <td className="px-4 py-3 font-mono font-semibold">{k.kod}</td>
                  <td className="px-4 py-3 font-semibold text-akcent">{opisRabatu(k)}</td>
                  <td className="px-4 py-3 text-[13px] text-ink-2">
                    {k.minKoszyk > 0 ? `od ${formatCena(k.minKoszyk)} zł` : "bez minimum"}
                    {k.waznyDo ? ` · do ${DATA_PL(k.waznyDo)}` : ""}
                    {k.limitUzyc ? ` · limit ${k.limitUzyc}` : ""}
                  </td>
                  <td className="px-4 py-3 text-[13px]">{k.uzyto}{k.limitUzyc ? ` / ${k.limitUzyc}` : ""}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void przelacz(k)}
                      className={`px-2.5 py-1 text-[11px] font-semibold ${k.aktywny ? "bg-[oklch(72%_0.12_150)] text-tlo" : "bg-szary text-ink-2"}`}
                    >
                      {k.aktywny ? "Aktywny" : "Wyłączony"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => void usun(k)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
