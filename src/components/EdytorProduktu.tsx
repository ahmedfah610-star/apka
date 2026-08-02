"use client";

import { useRef, useState } from "react";
import { type Kategoria, type Produkt, type Wiek } from "@/data/produkty";

export function EdytorProduktu({
  produkt,
  onZamknij,
  onZapisano,
}: {
  produkt: Produkt;
  onZamknij: () => void;
  onZapisano: (zmiany: Partial<Produkt>) => void;
}) {
  const [nazwa, setNazwa] = useState(produkt.nazwa);
  const [cena, setCena] = useState(String(produkt.cena));
  const [kategoria, setKategoria] = useState<Kategoria>(produkt.kategoria);
  const [wiek, setWiek] = useState<Wiek>(produkt.wiek);
  const [badge, setBadge] = useState(produkt.badge ?? "");
  const [opis, setOpis] = useState(produkt.opis ?? "");

  const startZdj = produkt.zdjecia?.length ? produkt.zdjecia : produkt.zdjecie ? [produkt.zdjecie] : [];
  const [zdjecia, setZdjecia] = useState<string[]>(startZdj);
  const [urlZdj, setUrlZdj] = useState("");
  const [wgrywanie, setWgrywanie] = useState(false);

  const maStart = !!produkt.rozmiary && produkt.rozmiary.length > 0;
  const [maRozmiary, setMaRozmiary] = useState(maStart);
  const [rozmiary, setRozmiary] = useState<string[]>(produkt.rozmiary ?? []);
  const [stany, setStany] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const r of produkt.rozmiary ?? []) m[r] = produkt.stanRozmiary?.[r] ?? 0;
    return m;
  });
  const [stanProsty, setStanProsty] = useState(typeof produkt.stan === "number" && !maStart ? String(produkt.stan) : "");
  const [nowyRozmiar, setNowyRozmiar] = useState("");

  const [zapis, setZapis] = useState(false);
  const [komunikat, setKomunikat] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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
        if (res.ok && d.ok && d.url) setZdjecia((z) => [...z, d.url as string]);
        else if (d.powod === "brak_bazy") {
          setKomunikat("Wgrywanie plików wymaga bazy (Supabase Storage). Dodaj zdjęcie przez URL.");
          break;
        } else setKomunikat("Nie udało się wgrać pliku.");
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
  const ustawGlowne = (i: number) => setZdjecia((z) => [z[i], ...z.filter((_, idx) => idx !== i)]);
  const usunZdj = (i: number) => setZdjecia((z) => z.filter((_, idx) => idx !== i));

  function dodajRozmiar() {
    const r = nowyRozmiar.trim();
    if (!r || rozmiary.includes(r)) return;
    setRozmiary((p) => [...p, r]);
    setStany((s) => ({ ...s, [r]: 0 }));
    setNowyRozmiar("");
  }
  function usunRozmiar(r: string) {
    setRozmiary((p) => p.filter((x) => x !== r));
    setStany((s) => {
      const kop = { ...s };
      delete kop[r];
      return kop;
    });
  }

  async function zapisz() {
    const cenaN = parseFloat(cena.replace(",", "."));
    if (!nazwa.trim() || !Number.isFinite(cenaN)) {
      setKomunikat("Podaj nazwę i poprawną cenę.");
      return;
    }
    const zmiany: Partial<Produkt> = {
      nazwa: nazwa.trim(),
      cena: cenaN,
      kategoria,
      wiek,
      badge: badge || null,
      opis: opis.trim() || undefined,
      zdjecia,
      zdjecie: zdjecia[0] ?? null,
    };
    if (maRozmiary && rozmiary.length) {
      zmiany.rozmiary = rozmiary;
      zmiany.stanRozmiary = Object.fromEntries(rozmiary.map((r) => [r, Math.max(0, Number(stany[r]) || 0)]));
    } else {
      zmiany.rozmiary = [];
      zmiany.stanRozmiary = null;
      zmiany.stan = stanProsty.trim() === "" ? undefined : Math.max(0, parseInt(stanProsty, 10) || 0);
    }

    setZapis(true);
    try {
      const res = await fetch("/api/admin/produkty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: produkt.id, zmiany }),
      });
      const d = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
      if (!res.ok || d.ok === false) {
        setKomunikat(d.blad || "Nie udało się zapisać.");
        setZapis(false);
        return;
      }
      onZapisano(zmiany);
    } catch {
      setKomunikat("Błąd połączenia.");
      setZapis(false);
    }
  }

  const input = "w-full border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onZamknij}>
      <div className="w-full max-w-2xl border border-linia bg-tlo shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-linia px-5 py-3.5">
          <h2 className="text-[16px] font-bold">Edytuj produkt</h2>
          <button onClick={onZamknij} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {/* Zdjęcia */}
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Zdjęcia</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {zdjecia.map((z, i) => (
              <div key={i} className="group relative h-20 w-20 border border-linia bg-szary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z} alt="" className="h-full w-full object-contain p-0.5" />
                {i === 0 ? (
                  <span className="absolute left-0 top-0 bg-ink px-1 text-[9px] font-semibold text-tlo">GŁÓWNE</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => ustawGlowne(i)}
                    className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-[9px] font-semibold text-tlo opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    główne
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => usunZdj(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-ink text-[11px] text-tlo"
                  aria-label="Usuń zdjęcie"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={dodajPliki} className="text-[13px]" />
            {wgrywanie ? <span className="text-[12px] text-ink-2">Wgrywanie…</span> : null}
            <span className="text-[12px] text-ink-2">lub</span>
            <input
              className={`${input} max-w-[200px]`}
              placeholder="adres zdjęcia (URL)"
              value={urlZdj}
              onChange={(e) => setUrlZdj(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), dodajUrl())}
            />
            <button type="button" onClick={dodajUrl} className="border border-ink px-3 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
              Dodaj URL
            </button>
          </div>

          {/* Pola */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-[12px] font-semibold text-ink-2">
              Nazwa
              <input className={`${input} mt-1`} value={nazwa} onChange={(e) => setNazwa(e.target.value)} />
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Cena (zł)
              <input className={`${input} mt-1`} value={cena} onChange={(e) => setCena(e.target.value)} />
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Plakietka
              <select className={`${input} mt-1`} value={badge} onChange={(e) => setBadge(e.target.value)}>
                <option value="">Bez plakietki</option>
                <option value="NOWOŚĆ">NOWOŚĆ</option>
                <option value="BESTSELLER">BESTSELLER</option>
                <option value="-20%">-20%</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Kategoria
              <select className={`${input} mt-1`} value={kategoria} onChange={(e) => setKategoria(e.target.value as Kategoria)}>
                <option value="dziewczynki">Dziewczynki</option>
                <option value="chlopcy">Chłopcy</option>
                <option value="niemowleta">Niemowlęta</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Wiek
              <select className={`${input} mt-1`} value={wiek} onChange={(e) => setWiek(e.target.value as Wiek)}>
                <option value="0-2">0-2 lata</option>
                <option value="2-6">2-6 lat</option>
                <option value="6-12">6-12 lat</option>
              </select>
            </label>
            <label className="sm:col-span-2 text-[12px] font-semibold text-ink-2">
              Opis
              <textarea className={`${input} mt-1 min-h-[70px]`} value={opis} onChange={(e) => setOpis(e.target.value)} />
            </label>
          </div>

          {/* Rozmiary i stany */}
          <div className="mt-5 border-t border-linia pt-4">
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input type="checkbox" checked={maRozmiary} onChange={(e) => setMaRozmiary(e.target.checked)} />
              Produkt ma rozmiary
            </label>

            {maRozmiary ? (
              <div className="mt-3">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">Rozmiary i ilości</p>
                <div className="flex flex-wrap gap-2">
                  {rozmiary.map((r) => (
                    <div key={r} className="flex items-center gap-1.5 border border-linia-2 bg-white px-2.5 py-1.5">
                      <span className="text-[12px] font-semibold text-ink-2">{r}</span>
                      <input
                        type="number"
                        min={0}
                        value={stany[r] ?? 0}
                        onChange={(e) => setStany((s) => ({ ...s, [r]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                        className="w-14 border border-linia-2 bg-white px-1.5 py-1 text-center text-[13px] outline-none focus:border-ink"
                      />
                      <button type="button" onClick={() => usunRozmiar(r)} className="text-ink-2 hover:text-akcent" aria-label="Usuń rozmiar">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className={`${input} max-w-[160px]`}
                    placeholder="nowy rozmiar (np. 116)"
                    value={nowyRozmiar}
                    onChange={(e) => setNowyRozmiar(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), dodajRozmiar())}
                  />
                  <button type="button" onClick={dodajRozmiar} className="border border-ink px-3 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
                    Dodaj rozmiar
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-3 block text-[12px] font-semibold text-ink-2">
                Stan / ilość (puste = bez limitu)
                <input className={`${input} mt-1 max-w-[160px]`} value={stanProsty} onChange={(e) => setStanProsty(e.target.value)} placeholder="∞" />
              </label>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-linia px-5 py-3.5">
          {komunikat ? <span className="text-[13px] text-akcent">{komunikat}</span> : <span />}
          <div className="flex gap-2">
            <button onClick={onZamknij} className="border border-linia-2 px-5 py-2.5 text-[13px] font-semibold hover:border-ink">
              Anuluj
            </button>
            <button
              onClick={zapisz}
              disabled={zapis}
              className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent disabled:opacity-60"
            >
              {zapis ? "ZAPISYWANIE…" : "ZAPISZ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
