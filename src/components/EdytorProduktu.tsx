"use client";

import { useEffect, useRef, useState } from "react";
import { KATEGORIE_LABEL, type Kategoria, type Produkt, type Wiek } from "@/data/produkty";
import { EdytorOpisu, tekstNaHtml } from "@/components/EdytorOpisu";
import { OPIS_KLASA } from "@/lib/opisStyl";
import { nizszeNaglowki } from "@/lib/opis";
import { formatCena } from "@/lib/filtrowanie";

const WIEK_LABEL: Record<Wiek, string> = { "0-2": "0-2 lata", "2-6": "2-6 lat", "6-12": "6-12 lat", dorosli: "rozmiar dorosły" };
const HUE: Record<Kategoria, number> = { dziewczynki: 340, chlopcy: 230, niemowleta: 160, dorosli: 90 };

// Uproszczona sanityzacja opisu HTML (na wypadek wklejenia czegoś niebezpiecznego).
function sanitizeHtml(html: string): string {
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}


export function EdytorProduktu({
  produkt,
  nowy = false,
  onZamknij,
  onZapisano,
}: {
  produkt: Produkt;
  nowy?: boolean;
  onZamknij: () => void;
  onZapisano: (zmiany: Partial<Produkt>) => void;
}) {
  const [nazwa, setNazwa] = useState(produkt.nazwa);
  const [cena, setCena] = useState(produkt.cena ? String(produkt.cena) : "");
  const [kategoria, setKategoria] = useState<Kategoria>(produkt.kategoria);
  const [wiek, setWiek] = useState<Wiek>(produkt.wiek);
  const [badge, setBadge] = useState(produkt.badge ?? "");
  const [kolor, setKolor] = useState(produkt.kolor ?? "");
  // Opisy: wspólny (bez rozmiarów albo „wszystkie rozmiary naraz") i osobny dla każdego
  // rozmiaru (wymiary z Allegro). Edytor startuje od tego, co widzi klient; zapis rusza
  // opisy TYLKO, gdy admin coś w nich zmienił.
  const [wczytany, setWczytany] = useState(nowy);
  const [wspolny, setWspolny] = useState("");
  const [opisy, setOpisy] = useState<Record<string, string>>({});
  const [zmianaOpisu, setZmianaOpisu] = useState(false);
  const [zakladka, setZakladka] = useState("*"); // "*" = wszystkie rozmiary naraz
  const [startZakladki, setStartZakladki] = useState(""); // treść, od której startuje edytor po przełączeniu
  const [wersja, setWersja] = useState(0); // przemontowanie edytora przy zmianie zakładki
  useEffect(() => {
    if (nowy) return;
    let aktywny = true;
    const ustaw = (p: Produkt) => {
      const rozm = p.opisRozmiary ?? {};
      const lista = p.rozmiary ?? [];
      const pierwszy = lista.map((r) => rozm[r]).find(Boolean) ?? Object.values(rozm).find(Boolean);
      const baza = p.opisHtml || pierwszy || (p.opis ? tekstNaHtml(p.opis) : "");
      const mapa = Object.fromEntries(lista.map((r) => [r, rozm[r] || baza]));
      setOpisy(mapa);
      setWspolny(baza);
      // Produkt z rozmiarami: zawsze edytujemy opis konkretnego rozmiaru (bez „wszystkie naraz").
      const start = lista.length ? lista[0] : "*";
      setZakladka(start);
      setStartZakladki(start === "*" ? baza : mapa[start] ?? baza);
      setWczytany(true);
    };
    // Lista produktów nie zawiera opisów (są ciężkie) — dociągamy pełny produkt.
    fetch(`/api/admin/produkty?id=${encodeURIComponent(produkt.id)}`)
      .then((r) => r.json())
      .then((d) => aktywny && ustaw(d?.produkt ?? produkt))
      .catch(() => aktywny && ustaw(produkt));
    return () => {
      aktywny = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowy, produkt.id]);

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

  const STANDARDOWE = ["56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "140", "146", "152", "158", "164"];

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

  function dodajRozmiar(r: string) {
    const rr = (r ?? "").trim().replace(/\s+/g, "");
    if (!rr || rozmiary.includes(rr)) return;
    setRozmiary((p) => [...p, rr].sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0)));
    setStany((s) => ({ ...s, [rr]: s[rr] ?? 0 }));
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

  // Co zapisać z opisów: przy rozmiarach — opis każdego rozmiaru (+ pierwszy jako główny),
  // bez rozmiarów — jeden opis.
  function daneOpisu(): Partial<Produkt> {
    const tekst = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() || undefined;
    if (maRozmiary && rozmiary.length) {
      const mapa = Object.fromEntries(rozmiary.map((r) => [r, sanitizeHtml((opisy[r] ?? wspolny).trim())]));
      const glowny = mapa[rozmiary[0]] ?? "";
      return { opisRozmiary: mapa, opisHtml: glowny || null, opis: tekst(glowny) };
    }
    return { opisHtml: wspolny.trim() ? sanitizeHtml(wspolny.trim()) : null, opis: tekst(wspolny) };
  }

  async function zapisz() {
    const cenaN = parseFloat(cena.replace(",", "."));
    if (!nazwa.trim() || !Number.isFinite(cenaN)) {
      setKomunikat("Podaj nazwę i poprawną cenę.");
      return;
    }
    const wspolne: Partial<Produkt> = {
      nazwa: nazwa.trim(),
      cena: cenaN,
      kategoria,
      wiek,
      wiekLabel: WIEK_LABEL[wiek],
      badge: badge || null,
      kolor: kolor.trim() || null,
      ...(zmianaOpisu || nowy ? daneOpisu() : {}),
      zdjecia,
      zdjecie: zdjecia[0] ?? null,
      hue: HUE[kategoria],
    };
    if (maRozmiary && rozmiary.length) {
      wspolne.rozmiary = rozmiary;
      wspolne.stanRozmiary = Object.fromEntries(rozmiary.map((r) => [r, Math.max(0, Number(stany[r]) || 0)]));
      wspolne.stan = Object.values(wspolne.stanRozmiary).reduce((s, v) => s + v, 0);
    } else {
      wspolne.rozmiary = [];
      wspolne.stanRozmiary = null;
      wspolne.stan = stanProsty.trim() === "" ? undefined : Math.max(0, parseInt(stanProsty, 10) || 0);
    }

    setZapis(true);
    try {
      if (nowy) {
        const nowyProdukt: Produkt = {
          id: `reczny-${Date.now().toString(36)}`,
          ukryty: false,
          ...wspolne,
        } as Produkt;
        const res = await fetch("/api/admin/produkty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nowyProdukt),
        });
        const d = (await res.json().catch(() => ({}))) as { ok?: boolean; powod?: string; blad?: string };
        if (!res.ok || d.ok === false) {
          setKomunikat(d.powod === "brak_bazy" ? "Dodawanie wymaga podłączonej bazy (Supabase)." : d.blad || "Nie udało się zapisać.");
          setZapis(false);
          return;
        }
        onZapisano(nowyProdukt);
      } else {
        const res = await fetch("/api/admin/produkty", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: produkt.id, zmiany: wspolne }),
        });
        const d = (await res.json().catch(() => ({}))) as { ok?: boolean; blad?: string };
        if (!res.ok || d.ok === false) {
          setKomunikat(d.blad || "Nie udało się zapisać.");
          setZapis(false);
          return;
        }
        onZapisano(wspolne);
      }
    } catch {
      setKomunikat("Błąd połączenia.");
      setZapis(false);
    }
  }

  const opisWidoczny = zakladka === "*" || !(maRozmiary && rozmiary.length) ? wspolny : opisy[zakladka] ?? wspolny;

  function przelaczZakladke(z: string) {
    if (z === zakladka) return;
    setZakladka(z);
    setStartZakladki(z === "*" ? wspolny : opisy[z] ?? wspolny);
    setWersja((w) => w + 1);
  }

  function zmienOpis(html: string) {
    setZmianaOpisu(true);
    if (zakladka === "*" || !(maRozmiary && rozmiary.length)) {
      setWspolny(html);
      if (maRozmiary) setOpisy(Object.fromEntries(rozmiary.map((r) => [r, html])));
    } else {
      setOpisy((o) => ({ ...o, [zakladka]: html }));
    }
  }

  const input = "w-full rounded-lg border border-linia-2 bg-white px-3 py-2 text-[16px] outline-none focus:border-ink md:text-[14px]";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onZamknij}>
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-linia bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-linia px-5 py-3.5">
          <h2 className="text-[16px] font-bold">{nowy ? "Wystaw nowy produkt" : "Edytuj produkt"}</h2>
          <button onClick={onZamknij} aria-label="Zamknij" className="text-ink-2 hover:text-ink">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-5">
          {/* Zdjęcia */}
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Zdjęcia <span className="font-normal">(pierwsze = główne, najedź by zmienić)</span></p>
          <div className="mb-3 flex flex-wrap gap-2">
            {zdjecia.map((z, i) => (
              <div key={i} className="group relative h-20 w-20 border border-linia bg-szary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={z} alt="" className="h-full w-full object-contain p-0.5" />
                {i === 0 ? (
                  <span className="absolute left-0 top-0 bg-ink px-1 text-[9px] font-semibold text-tlo">Główne</span>
                ) : (
                  <button type="button" onClick={() => ustawGlowne(i)} className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-[9px] font-semibold text-tlo opacity-0 transition-opacity group-hover:opacity-100">
                    główne
                  </button>
                )}
                <button type="button" onClick={() => usunZdj(i)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center bg-ink text-[11px] text-tlo" aria-label="Usuń zdjęcie">
                  ✕
                </button>
              </div>
            ))}
            {zdjecia.length === 0 ? <span className="flex h-20 w-full items-center text-[12px] text-ink-2">Brak zdjęć — wgraj z dysku lub dodaj URL.</span> : null}
          </div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={dodajPliki} className="text-[13px]" />
            {wgrywanie ? <span className="text-[12px] text-ink-2">Wgrywanie…</span> : null}
            <span className="text-[12px] text-ink-2">lub</span>
            <input className={`${input} max-w-[200px]`} placeholder="adres zdjęcia (URL)" value={urlZdj} onChange={(e) => setUrlZdj(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), dodajUrl())} />
            <button type="button" onClick={dodajUrl} className="border border-ink px-3 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
              Dodaj URL
            </button>
          </div>

          {/* Pola */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-[12px] font-semibold text-ink-2">
              Nazwa
              <input className={`${input} mt-1`} value={nazwa} onChange={(e) => setNazwa(e.target.value)} placeholder="np. Bluza dziecięca z kapturem" />
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Cena (zł)
              <input className={`${input} mt-1`} value={cena} onChange={(e) => setCena(e.target.value)} placeholder="49.99" />
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Kolor
              <input className={`${input} mt-1`} value={kolor} onChange={(e) => setKolor(e.target.value)} placeholder="np. różowy" />
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Kategoria
              <select className={`${input} mt-1`} value={kategoria} onChange={(e) => setKategoria(e.target.value as Kategoria)}>
                <option value="dziewczynki">Dziewczynki</option>
                <option value="chlopcy">Chłopcy</option>
                <option value="niemowleta">Niemowlęta</option>
                <option value="dorosli">Męskie</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-ink-2">
              Wiek
              <select className={`${input} mt-1`} value={wiek} onChange={(e) => setWiek(e.target.value as Wiek)}>
                <option value="0-2">0-2 lata</option>
                <option value="2-6">2-6 lat</option>
                <option value="6-12">6-12 lat</option>
                <option value="dorosli">Dorośli</option>
              </select>
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
          </div>

          {/* Opis — edytor bez kodu, osobno dla każdego rozmiaru albo dla wszystkich naraz */}
          <div className="mt-6 border-t border-linia pt-5">
            <p className="mb-1 text-[15px] font-bold text-ink">Opis produktu</p>
            <p className="mb-3 text-[13px] text-ink-2">
              Pisz jak w zwykłym edytorze. Zaznacz tekst i kliknij „B”, żeby go pogrubić, albo „Nagłówek”, żeby zrobić z linijki tytuł.
            </p>
            {maRozmiary && rozmiary.length > 0 ? (
              <div className="mb-3">
                <p className="mb-1.5 text-[13px] font-semibold text-ink">Który opis edytujesz?</p>
                <div className="flex flex-wrap gap-1.5">
                  {rozmiary.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => przelaczZakladke(z)}
                      className={`rounded-lg border px-3 py-1.5 text-[13.5px] font-bold transition-colors ${
                        zakladka === z ? "border-ink bg-ink text-white" : "border-linia-2 bg-white text-ink hover:border-ink"
                      }`}
                    >
                      Rozmiar {z}
                    </button>
                  ))}
                </div>
                <p className="mt-2 rounded-lg bg-akcent-2 px-3 py-2 text-[13px] text-ink">
                  {zakladka === "*"
                    ? "Opis wspólny (nowe rozmiary). Kliknij rozmiar, żeby edytować jego opis osobno."
                    : `Zmieniasz opis tylko dla rozmiaru ${zakladka}. Pozostałe rozmiary zostają bez zmian.`}
                </p>
              </div>
            ) : null}
            {!wczytany ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border-2 border-linia-2 text-[14px] text-ink-2">Wczytywanie opisu…</div>
            ) : (
              <EdytorOpisu key={`${zakladka}-${wersja}`} poczatkowy={startZakladki} onZmiana={zmienOpis} />
            )}
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
                      <input type="number" min={0} value={stany[r] ?? 0} onChange={(e) => setStany((s) => ({ ...s, [r]: Math.max(0, parseInt(e.target.value, 10) || 0) }))} className="w-14 border border-linia-2 bg-white px-1.5 py-1 text-center text-[13px] outline-none focus:border-ink" />
                      <button type="button" onClick={() => usunRozmiar(r)} className="text-ink-2 hover:text-akcent" aria-label="Usuń rozmiar">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {/* Szybkie dodawanie standardowych rozmiarów */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STANDARDOWE.filter((r) => !rozmiary.includes(r)).map((r) => (
                    <button key={r} type="button" onClick={() => dodajRozmiar(r)} className="border border-linia-2 px-2.5 py-1 text-[12.5px] font-semibold hover:border-ink" title="Dodaj rozmiar">
                      + {r}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input className={`${input} max-w-[160px]`} placeholder="inny rozmiar (np. 50, S)" value={nowyRozmiar} onChange={(e) => setNowyRozmiar(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), dodajRozmiar(nowyRozmiar))} />
                  <button type="button" onClick={() => dodajRozmiar(nowyRozmiar)} className="border border-ink px-3 py-2 text-[13px] font-semibold hover:bg-ink hover:text-tlo">
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
          {/* Podgląd oferty — na żywo, tak jak zobaczy klient */}
          <div className="mt-6 border-t border-linia pt-5">
            <p className="mb-3 text-[15px] font-bold text-ink">
              Podgląd oferty <span className="font-normal text-ink-2">— tak zobaczy klient</span>
            </p>
            <div className="rounded-2xl border border-linia bg-strona p-4">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <div>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
                    {zdjecia[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={zdjecia[0]} alt="" className="h-full w-full object-contain p-3" />
                    ) : (
                      <span className="text-[13px] text-ink-2">Brak zdjęcia</span>
                    )}
                  </div>
                  {zdjecia.length > 1 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {zdjecia.slice(1, 6).map((z, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={z} alt="" className="h-12 w-12 rounded-md border border-linia bg-white object-contain p-0.5" />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[11.5px] uppercase tracking-wide text-ink-2">
                    {[KATEGORIE_LABEL[kategoria], WIEK_LABEL[wiek], kolor.trim() || null].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-[22px] font-extrabold leading-tight tracking-tight text-ink">{nazwa.trim() || "Nazwa produktu"}</p>
                  <p className="mt-1.5 text-[22px] font-extrabold text-ink">
                    {Number.isFinite(parseFloat(cena.replace(",", "."))) ? `${formatCena(parseFloat(cena.replace(",", ".")))} zł` : "— zł"}
                  </p>
                  {badge ? <span className="mt-2 inline-block rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">{badge}</span> : null}
                  {maRozmiary && rozmiary.length ? (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[13px] font-bold text-ink">Rozmiar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rozmiary.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => przelaczZakladke(r)}
                            className={`rounded-lg border px-3 py-1.5 text-[13px] font-bold ${
                              zakladka === r
                                ? "border-ink bg-ink text-white"
                                : (Number(stany[r]) || 0) > 0
                                  ? "border-linia-2 bg-white text-ink"
                                  : "border-linia bg-szary text-ink-2 line-through"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <span className="mt-4 block w-full rounded-xl bg-ink py-3 text-center text-[14px] font-bold text-white">Dodaj do koszyka</span>
                </div>
              </div>
              <div className="mt-5 border-t border-linia pt-4">
                <p className="mb-2 text-[17px] font-extrabold text-ink">Opis produktu</p>
                {maRozmiary && rozmiary.length > 1 ? (
                  <p className="mb-2 text-[12.5px] text-ink-2">
                    {zakladka === "*" ? "Opis wspólny" : `Opis dla rozmiaru ${zakladka}`} — kliknij rozmiar wyżej, żeby zobaczyć inny.
                  </p>
                ) : null}
                {opisWidoczny.trim() ? (
                  <div className={OPIS_KLASA} dangerouslySetInnerHTML={{ __html: nizszeNaglowki(sanitizeHtml(opisWidoczny)) ?? "" }} />
                ) : (
                  <p className="text-[14px] text-ink-2">Brak opisu.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-linia px-5 py-3.5">
          {komunikat ? <span className="text-[13px] text-akcent">{komunikat}</span> : <span />}
          <div className="flex gap-2">
            <button onClick={onZamknij} className="rounded-lg border border-linia-2 px-5 py-2.5 text-[14px] font-bold hover:border-ink">
              Anuluj
            </button>
            <button onClick={zapisz} disabled={zapis} className="rounded-lg bg-ink px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-akcent disabled:opacity-60">
              {zapis ? "Zapisywanie…" : nowy ? "Wystaw produkt" : "Zapisz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
