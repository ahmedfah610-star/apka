"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type Kategoria, type Produkt, type Wiek } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import {
  dodajProdukt,
  glowneZdjecie,
  katalog,
  pobierzDodatkowe,
  ustawOverride,
  usunProdukt,
  zbudujProdukt,
} from "@/lib/sklepStore";

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

function czytajPlikiJakoDataURL(pliki: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(pliki).map(
      (f) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = rej;
          r.readAsDataURL(f);
        }),
    ),
  );
}

export default function AdminProdukty() {
  const [lista, setLista] = useState<Produkt[]>([]);
  const [dodaneIds, setDodaneIds] = useState<Set<string>>(new Set());
  const [szukaj, setSzukaj] = useState("");
  const [form, setForm] = useState(PUSTY);
  const [zdjecia, setZdjecia] = useState<string[]>([]);
  const [urlZdj, setUrlZdj] = useState("");
  const [komunikat, setKomunikat] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const odswiez = () => {
    setLista(katalog());
    setDodaneIds(new Set(pobierzDodatkowe().map((p) => p.id)));
  };
  useEffect(odswiez, []);

  const widoczne = useMemo(
    () => lista.filter((p) => p.nazwa.toLowerCase().includes(szukaj.toLowerCase())),
    [lista, szukaj],
  );

  async function dodajPliki(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const nowe = await czytajPlikiJakoDataURL(e.target.files);
    setZdjecia((z) => [...z, ...nowe]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function dodajUrl() {
    if (urlZdj.trim()) {
      setZdjecia((z) => [...z, urlZdj.trim()]);
      setUrlZdj("");
    }
  }

  function zapiszProdukt(e: React.FormEvent) {
    e.preventDefault();
    const cena = parseFloat(form.cena.replace(",", "."));
    if (!form.nazwa.trim() || !Number.isFinite(cena)) {
      setKomunikat("Podaj nazwę i poprawną cenę.");
      return;
    }
    const ok = dodajProdukt(
      zbudujProdukt({
        nazwa: form.nazwa,
        cena,
        kategoria: form.kategoria,
        wiek: form.wiek,
        rozmiary: form.rozmiary.split(",").map((s) => s.trim()).filter(Boolean),
        zdjecia,
        stan: form.stan.trim() === "" ? null : parseInt(form.stan, 10),
        badge: form.badge || null,
        opis: form.opis.trim() || undefined,
      }),
    );
    if (!ok) {
      setKomunikat("Nie udało się zapisać — zdjęcia mogą być za duże (limit przeglądarki). Użyj mniejszych plików lub adresów URL.");
      return;
    }
    setForm(PUSTY);
    setZdjecia([]);
    setKomunikat("Produkt dodany ✓");
    odswiez();
    setTimeout(() => setKomunikat(""), 3000);
  }

  const edytuj = (id: string, zmiany: Partial<Pick<Produkt, "cena" | "stan" | "badge" | "ukryty">>) => {
    ustawOverride(id, zmiany);
    odswiez();
  };
  const usun = (id: string) => {
    usunProdukt(id);
    odswiez();
  };

  const input = "w-full border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";
  const naStanie = lista.reduce((s, p) => s + (typeof p.stan === "number" ? p.stan : 0), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Produkty</h1>
          <p className="text-[14px] text-ink-2">
            {lista.length} ofert · {dodaneIds.size} dodanych w panelu · {naStanie} szt. z ustalonym stanem
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
          <button type="submit" className="bg-ink px-6 py-2.5 text-[13px] font-semibold tracking-wide text-tlo transition-colors hover:bg-akcent">
            WYSTAW PRODUKT
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
              const dodany = dodaneIds.has(p.id);
              const zdj = glowneZdjecie(p);
              return (
                <tr key={p.id} className="bg-white align-middle">
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
                        <span className="text-[12px] text-ink-2">{p.kategoria} · {dodany ? "dodany" : "z kodu"}</span>
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
                          if (Number.isFinite(v) && v !== p.cena) edytuj(p.id, { cena: v });
                        }}
                        className="w-20 border border-linia-2 bg-white px-2 py-1 text-[13px] outline-none focus:border-ink"
                      />
                      <span className="text-[12px] text-ink-2">zł</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center">
                      <button
                        onClick={() => edytuj(p.id, { stan: Math.max(0, (typeof p.stan === "number" ? p.stan : 0) - 1) })}
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
                          if (v !== p.stan) edytuj(p.id, { stan: v });
                        }}
                        className="w-14 border-y border-linia-2 bg-white px-2 py-1 text-center text-[13px] outline-none focus:border-ink"
                      />
                      <button
                        onClick={() => edytuj(p.id, { stan: (typeof p.stan === "number" ? p.stan : 0) + 1 })}
                        className="border border-linia-2 px-2 py-1 text-ink-2 hover:text-ink"
                        aria-label="Zwiększ stan"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => edytuj(p.id, { ukryty: !p.ukryty })}
                      className={`px-2.5 py-1 text-[11px] font-semibold ${p.ukryty ? "bg-szary text-ink-2" : "bg-[oklch(72%_0.12_150)] text-tlo"}`}
                    >
                      {p.ukryty ? "Wyłączona" : "Aktywna"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {dodany ? (
                      <button onClick={() => usun(p.id)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                        Usuń
                      </button>
                    ) : (
                      <span className="text-[12px] text-ink-2">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {widoczne.length > 60 ? (
        <p className="mt-3 text-[12px] text-ink-2">Pokazano 60 z {widoczne.length}. Zawęź wyszukiwaniem.</p>
      ) : null}

      <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-ink-2">
        Zmiany (cena, stan, status) i nowe produkty zapisują się w tej przeglądarce (localStorage) i działają
        w sklepie na tym urządzeniu. Aby były trwałe i wspólne dla wszystkich klientów — podłącz bazę danych
        (patrz README). Duże zdjęcia wgrywane z dysku zajmują miejsce w pamięci przeglądarki; do wielu zdjęć
        lepsze są adresy URL.
      </p>
    </div>
  );
}
