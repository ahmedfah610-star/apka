"use client";

import { useEffect, useMemo, useState } from "react";

interface Opinia {
  id: string;
  produktId: string;
  imie: string;
  email: string;
  ocena: number;
  tresc: string | null;
  zatwierdzona: boolean;
  utworzono: string;
}

const DATA_PL = (iso: string) => new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

function Gwiazdki({ ocena }: { ocena: number }) {
  return (
    <span className="inline-flex" aria-label={`Ocena ${ocena}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" className={i <= ocena ? "text-akcent" : "text-linia-2"} fill="currentColor">
          <path d="m12 17.3-6.16 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.48 4.73 1.64 7.03z" />
        </svg>
      ))}
    </span>
  );
}

export default function AdminOpinie() {
  const [lista, setLista] = useState<Opinia[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [filtr, setFiltr] = useState<"wszystkie" | "widoczne" | "ukryte">("wszystkie");

  const odswiez = async () => {
    setLadowanie(true);
    try {
      const r = await fetch("/api/admin/opinie");
      const d = await r.json();
      if (Array.isArray(d.items)) setLista(d.items);
    } catch {
      /* ignoruj */
    } finally {
      setLadowanie(false);
    }
  };
  useEffect(() => { void odswiez(); }, []);

  async function przelacz(o: Opinia) {
    setLista((prev) => prev.map((x) => (x.id === o.id ? { ...x, zatwierdzona: !x.zatwierdzona } : x)));
    try {
      await fetch("/api/admin/opinie", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id, zatwierdzona: !o.zatwierdzona }),
      });
    } catch { void odswiez(); }
  }

  async function usun(o: Opinia) {
    if (!confirm("Usunąć tę opinię na stałe?")) return;
    setLista((prev) => prev.filter((x) => x.id !== o.id));
    try {
      await fetch("/api/admin/opinie", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: o.id }),
      });
    } catch { void odswiez(); }
  }

  const widoczne = useMemo(
    () => lista.filter((o) => (filtr === "wszystkie" ? true : filtr === "widoczne" ? o.zatwierdzona : !o.zatwierdzona)),
    [lista, filtr],
  );
  const liczby = useMemo(() => ({
    wszystkie: lista.length,
    widoczne: lista.filter((o) => o.zatwierdzona).length,
    ukryte: lista.filter((o) => !o.zatwierdzona).length,
  }), [lista]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Opinie</h1>
        <p className="text-[14px] text-ink-2">Moderuj opinie klientów — ukrywaj lub usuwaj nieodpowiednie.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {([["wszystkie", "Wszystkie"], ["widoczne", "Widoczne"], ["ukryte", "Ukryte"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFiltr(k)}
            className={`border px-3 py-1.5 text-[13px] transition-colors ${filtr === k ? "border-ink bg-ink text-tlo" : "border-linia-2 text-ink hover:border-ink"}`}
          >
            {l} <span className={filtr === k ? "opacity-80" : "text-ink-2"}>{liczby[k]}</span>
          </button>
        ))}
      </div>

      {ladowanie ? (
        <p className="text-[13px] text-ink-2">Wczytywanie…</p>
      ) : widoczne.length === 0 ? (
        <div className="border border-linia bg-white px-6 py-12 text-center text-ink-2">
          <p className="text-[15px] font-semibold text-ink">Brak opinii</p>
          <p className="mt-1 text-[13px]">Opinie klientów pojawią się tutaj.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {widoczne.map((o) => (
            <div key={o.id} className={`border bg-white p-5 ${o.zatwierdzona ? "border-linia" : "border-akcent/40 bg-akcent/[0.03]"}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Gwiazdki ocena={o.ocena} />
                  <span className="text-[14px] font-semibold">{o.imie}</span>
                  <span className="text-[12px] text-ink-2">{DATA_PL(o.utworzono)}</span>
                  {!o.zatwierdzona ? <span className="bg-szary px-2 py-0.5 text-[11px] font-semibold text-ink-2">Ukryta</span> : null}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => void przelacz(o)} className="text-[13px] font-medium text-ink underline underline-offset-2 hover:text-akcent">
                    {o.zatwierdzona ? "Ukryj" : "Pokaż"}
                  </button>
                  <button onClick={() => void usun(o)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                    Usuń
                  </button>
                </div>
              </div>
              {o.tresc ? <p className="text-[14px] leading-relaxed text-ink-2">{o.tresc}</p> : <p className="text-[13px] italic text-ink-3">(sama ocena, bez treści)</p>}
              <p className="mt-2 text-[12px] text-ink-3">
                Produkt: <a href={`/produkty/${o.produktId}`} target="_blank" rel="noreferrer" className="underline hover:text-akcent">{o.produktId}</a> · {o.email}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
