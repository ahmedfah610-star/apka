"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { type Kategoria, type Produkt, type Wiek } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { glowneZdjecie, zbudujProdukt } from "@/lib/sklepStore";

const PUSTY = {
  nazwa: "",
  cena: "",
  kategoria: "dziewczynki" as Kategoria,
  wiek: "2-6" as Wiek,
  rozmiary: "",
  stan: "",
  badge: "",
  opis: "",
};

export default function AdminProdukty() {
  const [lista, setLista] = useState<Produkt[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [szukaj, setSzukaj] = useState("");
  const [form, setForm] = useState(PUSTY);
  const [zdjecia, setZdjecia] = useState<string[]>([]);
  const [urlZdj, setUrlZdj] = useState("");
  const [komunikat, setKomunikat] = useState("");
  const [wgrywanie, setWgrywanie] = useState(false);
  const [zapis, setZapis] = useState(false);
  const [rozwiniety, setRozwiniety] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const odswiez = async () => {
    setLadowanie(true);
    try {
      const r = await fetch("/api/admin/produkty");
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
    () => lista.filter((p) => p.nazwa.toLowerCase().includes(szukaj.toLowerCase())),
    [lista, szukaj],
  );

  async function dodajPliki(e: React.ChangeEvent<HTMLInputElement>) {
    const pliki = e.target.files;
    if (!pliki?.length) return;
    setWgrywanie(true);
    setKomunikat("");
    try {
      for (const plik of Array.from(pliki)) {
        const fd = new FormData();
        fd.append("plik", plik);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const d = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; powod?: string };
        if (res.ok && d.ok && d.url) {
          setZdjecia((z) => [...z, d.url as string]);
        } else if (d.powod === "brak_bazy") {
          setKomunikat("Wgrywanie plików wymaga podłączonej bazy (Supabase Storage). Na razie dodaj zdjęcia przez adres URL.");
          break;
        } else {
          setKomunikat("Nie udało się wgrać pliku.");
        }
      }
    } finally {
      setWgrywanie(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function dodajUrl() {
    if (urlZdj.trim()) {
      setZdjecia((z) => [...z, urlZdj.trim()]);
      setUrlZdj("");
    }
  }

  async function zapiszProdukt(e: React.FormEvent) {
    e.preventDefault();
    const cena = parseFloat(form.cena.replace(",", "."));
    if (!form.nazwa.trim() || !Number.isFinite(cena)) {
      setKomunikat("Podaj nazwę i poprawną cenę.");
      return;
    }
    setZapis(true);
    setKomunikat("");
    const produkt = zbudujProdukt({
      nazwa: form.nazwa,
      cena,
      kategoria: form.kategoria,
      wiek: form.wiek,
      rozmiary: form.rozmiary.split(",").map((s) => s.trim()).filter(Boolean),
      zdjecia,
      stan: form.stan.trim() === "" ? null : parseInt(form.stan, 10),
      badge: form.badge || null,
      opis: form.opis.trim() || undefined,
    });
    try {
      const res = await fetch("/api/admin/produkty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produkt),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; powod?: string; blad?: string };
      if (!res.ok || d.ok === false) {
        setKomunikat(
          d.powod === "brak_bazy"
            ? "Dodawanie produktów wymaga podłączonej bazy (Supabase). Uzupełnij zmienne środowiskowe."
            : d.blad || "Nie udało się zapisać produktu.",
        );
        return;
      }
      setForm(PUSTY);
      setZdjecia([]);
      setKomunikat("Produkt dodany ✓");
      await odswiez();
      setTimeout(() => setKomunikat(""), 3000);
    } catch {
      setKomunikat("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setZapis(false);
    }
  }

  async function edytuj(id: string, zmiany: Partial<Pick<Produkt, "cena" | "stan" | "badge" | "ukryty" | "stanRozmiary">>) {
    // Gdy zmieniamy stan per rozmiar — utrzymaj też łączny stan w widoku.
    const patch = { ...zmiany };
    if (zmiany.stanRozmiary) {
      patch.stan = Object.values(zmiany.stanRozmiary).reduce((s, v) => s + (Number(v) || 0), 0);
    }
    // Optymistycznie aktualizujemy widok.
    setLista((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      await fetch("/api/admin/produkty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, zmiany }),
      });
    } catch {
      void odswiez();
    }
  }

  async function usun(id: string) {
    if (!confirm("Usunąć ten produkt na stałe?")) return;
    setLista((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch("/api/admin/produkty", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      void odswiez();
    }
  }

  const input = "w-full border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";
  const naStanie = lista.reduce((s, p) => s + (typeof p.stan === "number" ? p.stan : 0), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Produkty</h1>
          <p className="text-[14px] text-ink-2">
            {lista.length} ofert · {naStanie} szt. z ustalonym stanem
          </p>
        </div>
      </div>

      {/* Formularz dodawania (jak wystawianie na Allegro) */}
      <form onSubmit={zapiszProdukt} className="mb-8 border border-linia bg-white p-5">
        <h2 className="mb-4 text-[15px] font-bold">Wystaw nowy produkt</h2>

        {/* Zdjęcia */}
        <div className="mb-4">
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Zdjęcia</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {zdjecia.map((z, i) => (
              <div key={i} className="relative h-20 w-20 border border-linia bg-szary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z} alt="" className="h-full w-full object-contain p-0.5" />
                {i === 0 ? (
                  <span className="absolute left-0 top-0 bg-ink px-1 text-[9px] font-semibold text-tlo">GŁÓWNE</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setZdjecia((zz) => zz.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-ink text-[11px] text-tlo"
                  aria-label="Usuń zdjęcie"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={dodajPliki} className="text-[13px]" />
            {wgrywanie ? <span className="text-[12px] text-ink-2">Wgrywanie…</span> : null}
            <span className="text-[12px] text-ink-2">lub</span>
            <input
              className={`${input} max-w-xs`}
              placeholder="wklej adres zdjęcia (URL)"
              value={urlZdj}
              onChange={(e) => setUrlZdj(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), dodajUrl())}
            />
            <button type="button" onClick={dodajUrl} className="border border-ink px-3 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
              Dodaj URL
            </button>
          </div>
        </div>

        {/* Pola */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={input} placeholder="Nazwa" value={form.nazwa} onChange={(e) => setForm({ ...form, nazwa: e.target.value })} />
          <input className={input} placeholder="Cena (np. 49.99)" value={form.cena} onChange={(e) => setForm({ ...form, cena: e.target.value })} />
          <input className={input} placeholder="Stan / ilość (np. 20)" value={form.stan} onChange={(e) => setForm({ ...form, stan: e.target.value })} />
          <select className={input} value={form.kategoria} onChange={(e) => setForm({ ...form, kategoria: e.target.value as Kategoria })}>
            <option value="dziewczynki">Dziewczynki</option>
            <option value="chlopcy">Chłopcy</option>
            <option value="niemowleta">Niemowlęta</option>
          </select>
          <select className={input} value={form.wiek} onChange={(e) => setForm({ ...form, wiek: e.target.value as Wiek })}>
            <option value="0-2">0-2 lata</option>
            <option value="2-6">2-6 lat</option>
            <option value="6-12">6-12 lat</option>
          </select>
          <select className={input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
            <option value="">Bez plakietki</option>
            <option value="NOWOŚĆ">NOWOŚĆ</option>
            <option value="BESTSELLER">BESTSELLER</option>
            <option value="-20%">-20%</option>
          </select>
          <input className={`${input} sm:col-span-2 lg:col-span-3`} placeholder="Rozmiary po przecinku (np. 92, 98, 104)" value={form.rozmiary} onChange={(e) => setForm({ ...form, rozmiary: e.target.value })} />
          <input className={`${input} sm:col-span-2 lg:col-span-3`} placeholder="Krótki opis (opcjonalnie)" value={form.opis} onChange={(e) => setForm({ ...form, opis: e.target.value })} />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button type="submit" disabled={zapis} className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60">
            {zapis ? "ZAPISYWANIE…" : "WYSTAW PRODUKT"}
          </button>
          {komunikat ? <span className="text-[13px] text-ink-2">{komunikat}</span> : null}
        </div>
      </form>

      <input className={`${input} mb-4 max-w-sm`} placeholder="Szukaj po nazwie…" value={szukaj} onChange={(e) => setSzukaj(e.target.value)} />

      {/* Tabela zarządzania */}
      <div className="overflow-x-auto border border-linia">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2">
            <tr>
              <th className="px-4 py-3 font-semibold">Produkt</th>
              <th className="px-4 py-3 font-semibold">Cena</th>
              <th className="px-4 py-3 font-semibold">Stan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linia">
            {widoczne.slice(0, 60).map((p) => {
              const zdj = glowneZdjecie(p);
              return (
                <Fragment key={p.id}>
                <tr className="bg-white align-middle">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-szary">
                        {zdj ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={zdj} alt="" className="h-full w-full object-contain p-0.5" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block font-medium leading-tight">{p.nazwa}</span>
                        <span className="text-[12px] text-ink-2">{p.kategoria}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <input
                        key={`c-${p.id}-${p.cena}`}
                        defaultValue={p.cena}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          if (Number.isFinite(v) && v !== p.cena) void edytuj(p.id, { cena: v });
                        }}
                        className="w-20 border border-linia-2 bg-white px-2 py-1 text-[13px] outline-none focus:border-ink"
                      />
                      <span className="text-[12px] text-ink-2">zł</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {p.stanRozmiary && p.rozmiary && p.rozmiary.length ? (
                      <button
                        onClick={() => setRozwiniety((r) => (r === p.id ? null : p.id))}
                        className="flex items-center gap-2 border border-linia-2 px-3 py-1.5 text-[13px] hover:border-ink"
                      >
                        <span className="font-semibold">{p.stan ?? 0} szt.</span>
                        <span className="text-[12px] text-ink-2">wg rozmiarów {rozwiniety === p.id ? "▲" : "▼"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center">
                        <button
                          onClick={() => void edytuj(p.id, { stan: Math.max(0, (typeof p.stan === "number" ? p.stan : 0) - 1) })}
                          className="border border-linia-2 px-2 py-1 text-ink-2 hover:text-ink"
                          aria-label="Zmniejsz stan"
                        >
                          −
                        </button>
                        <input
                          key={`s-${p.id}-${p.stan ?? "x"}`}
                          defaultValue={p.stan ?? ""}
                          placeholder="∞"
                          onBlur={(e) => {
                            const t = e.target.value.trim();
                            const v = t === "" ? undefined : Math.max(0, parseInt(t, 10) || 0);
                            if (v !== p.stan) void edytuj(p.id, { stan: v });
                          }}
                          className="w-14 border-y border-linia-2 bg-white px-2 py-1 text-center text-[13px] outline-none focus:border-ink"
                        />
                        <button
                          onClick={() => void edytuj(p.id, { stan: (typeof p.stan === "number" ? p.stan : 0) + 1 })}
                          className="border border-linia-2 px-2 py-1 text-ink-2 hover:text-ink"
                          aria-label="Zwiększ stan"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => void edytuj(p.id, { ukryty: !p.ukryty })}
                      className={`px-2.5 py-1 text-[11px] font-semibold ${p.ukryty ? "bg-szary text-ink-2" : "bg-[oklch(72%_0.12_150)] text-tlo"}`}
                    >
                      {p.ukryty ? "Wyłączona" : "Aktywna"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => void usun(p.id)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                      Usuń
                    </button>
                  </td>
                </tr>
                {rozwiniety === p.id && p.stanRozmiary && p.rozmiary ? (
                  <tr className="bg-szary/40">
                    <td colSpan={5} className="px-4 py-3">
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Stan wg rozmiarów</p>
                      <div className="flex flex-wrap gap-2.5">
                        {p.rozmiary.map((s) => (
                          <label key={s} className="flex items-center gap-1.5 border border-linia-2 bg-white px-2.5 py-1.5">
                            <span className="text-[12px] font-semibold text-ink-2">{s}</span>
                            <input
                              key={`sr-${p.id}-${s}-${p.stanRozmiary?.[s] ?? 0}`}
                              type="number"
                              min={0}
                              defaultValue={p.stanRozmiary?.[s] ?? 0}
                              onBlur={(e) => {
                                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                                const akt = p.stanRozmiary?.[s] ?? 0;
                                if (v !== akt) void edytuj(p.id, { stanRozmiary: { ...(p.stanRozmiary ?? {}), [s]: v } });
                              }}
                              className="w-14 border border-linia-2 bg-white px-1.5 py-1 text-center text-[13px] outline-none focus:border-ink"
                            />
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-ink-2">Zmiana zapisuje się po kliknięciu poza pole. Łączny stan liczy się automatycznie.</p>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {ladowanie ? (
        <p className="mt-3 text-[12px] text-ink-2">Wczytywanie…</p>
      ) : widoczne.length > 60 ? (
        <p className="mt-3 text-[12px] text-ink-2">Pokazano 60 z {widoczne.length}. Zawęź wyszukiwaniem.</p>
      ) : null}

      <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-ink-2">
        Zmiany (cena, stan, status) i nowe produkty zapisują się w bazie danych (Supabase) i są wspólne dla
        wszystkich klientów sklepu — stan magazynowy zmniejsza się automatycznie po każdym zamówieniu. Zdjęcia
        wgrywane z dysku trafiają do Supabase Storage; możesz też dodać zdjęcie przez adres URL.
      </p>
    </div>
  );
}
