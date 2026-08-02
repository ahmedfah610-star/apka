"use client";

import { useEffect, useMemo, useState } from "react";
import { PRODUKTY, type Kategoria, type Produkt, type Wiek } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { dodajProdukt, pobierzDodatkowe, usunProdukt, zbudujProdukt } from "@/lib/sklepStore";

const PUSTY = { nazwa: "", cena: "", kategoria: "dziewczynki" as Kategoria, wiek: "2-6" as Wiek, rozmiary: "", zdjecie: "", badge: "", opis: "" };

export default function AdminProdukty() {
  const [dodane, setDodane] = useState<Produkt[]>([]);
  const [szukaj, setSzukaj] = useState("");
  const [form, setForm] = useState(PUSTY);
  const [komunikat, setKomunikat] = useState("");

  const odswiez = () => setDodane(pobierzDodatkowe());
  useEffect(odswiez, []);

  const wszystkie = useMemo(() => {
    const dodaneIds = new Set(dodane.map((p) => p.id));
    return [...dodane, ...PRODUKTY.filter((p) => !dodaneIds.has(p.id))];
  }, [dodane]);

  const widoczne = useMemo(
    () => wszystkie.filter((p) => p.nazwa.toLowerCase().includes(szukaj.toLowerCase())),
    [wszystkie, szukaj],
  );
  const dodaneIds = useMemo(() => new Set(dodane.map((p) => p.id)), [dodane]);

  function zapisz(e: React.FormEvent) {
    e.preventDefault();
    const cena = parseFloat(form.cena.replace(",", "."));
    if (!form.nazwa.trim() || !Number.isFinite(cena)) {
      setKomunikat("Podaj nazwę i poprawną cenę.");
      return;
    }
    dodajProdukt(
      zbudujProdukt({
        nazwa: form.nazwa,
        cena,
        kategoria: form.kategoria,
        wiek: form.wiek,
        rozmiary: form.rozmiary.split(",").map((s) => s.trim()).filter(Boolean),
        zdjecie: form.zdjecie.trim() || null,
        badge: form.badge || null,
        opis: form.opis.trim() || undefined,
      }),
    );
    setForm(PUSTY);
    setKomunikat("Produkt dodany ✓");
    odswiez();
    setTimeout(() => setKomunikat(""), 2500);
  }

  function usun(id: string) {
    usunProdukt(id);
    odswiez();
  }

  function eksportujJson() {
    const blob = new Blob([JSON.stringify(dodane, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "produkty-dodane.json";
    a.click();
  }

  const input = "w-full border border-linia-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-ink";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Produkty</h1>
          <p className="text-[14px] text-ink-2">
            {wszystkie.length} w katalogu · {dodane.length} dodanych w panelu
          </p>
        </div>
        {dodane.length > 0 ? (
          <button onClick={eksportujJson} className="border border-ink px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-tlo">
            Eksportuj dodane (JSON)
          </button>
        ) : null}
      </div>

      {/* Formularz dodawania */}
      <form onSubmit={zapisz} className="mb-8 border border-linia bg-white p-5">
        <h2 className="mb-4 text-[15px] font-bold">Dodaj produkt</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={input} placeholder="Nazwa" value={form.nazwa} onChange={(e) => setForm({ ...form, nazwa: e.target.value })} />
          <input className={input} placeholder="Cena (np. 49.99)" value={form.cena} onChange={(e) => setForm({ ...form, cena: e.target.value })} />
          <input className={input} placeholder="Adres zdjęcia (URL)" value={form.zdjecie} onChange={(e) => setForm({ ...form, zdjecie: e.target.value })} />
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
            DODAJ PRODUKT
          </button>
          {komunikat ? <span className="text-[13px] text-ink-2">{komunikat}</span> : null}
        </div>
      </form>

      {/* Wyszukiwarka */}
      <input
        className={`${input} mb-4 max-w-sm`}
        placeholder="Szukaj po nazwie…"
        value={szukaj}
        onChange={(e) => setSzukaj(e.target.value)}
      />

      {/* Lista */}
      <div className="overflow-x-auto border border-linia">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="border-b border-linia bg-szary text-[12px] uppercase tracking-wide text-ink-2">
            <tr>
              <th className="px-4 py-3 font-semibold">Produkt</th>
              <th className="px-4 py-3 font-semibold">Kategoria</th>
              <th className="px-4 py-3 font-semibold">Cena</th>
              <th className="px-4 py-3 font-semibold">Źródło</th>
              <th className="px-4 py-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linia">
            {widoczne.slice(0, 100).map((p) => {
              const dodany = dodaneIds.has(p.id);
              return (
                <tr key={p.id} className="bg-white">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-szary">
                        {p.zdjecie ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.zdjecie} alt="" className="h-full w-full object-contain p-0.5" />
                        ) : null}
                      </span>
                      <span className="font-medium">{p.nazwa}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{p.kategoria}</td>
                  <td className="px-4 py-2.5">{formatCena(p.cena)} zł</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 text-[11px] font-semibold ${dodany ? "bg-akcent text-tlo" : "bg-szary text-ink-2"}`}>
                      {dodany ? "dodany" : "z kodu"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {dodany ? (
                      <button onClick={() => usun(p.id)} className="text-[13px] text-ink-2 underline underline-offset-2 hover:text-akcent">
                        Usuń
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {widoczne.length > 100 ? (
        <p className="mt-3 text-[12px] text-ink-2">Pokazano 100 z {widoczne.length}. Zawęź wyszukiwaniem.</p>
      ) : null}

      <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-ink-2">
        Produkty dodane w panelu zapisują się w tej przeglądarce (localStorage) i pojawiają się w sklepie
        na tym urządzeniu. Aby były trwałe i widoczne dla wszystkich, wyeksportuj je i dołącz do katalogu w
        repozytorium — albo podłącz bazę danych (patrz README).
      </p>
    </div>
  );
}
