"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProviders, rankingPoOpiniach } from "@/lib/providersService";
import { listaMiast } from "@/data/uslugodawcy";
import { KartaUslugodawcy } from "@/components/KartaUslugodawcy";
import type { TypUslugodawcy, Uslugodawca } from "@/types/domain";

export default function SpecjalisciPage() {
  const miasta = useMemo(() => listaMiast(), []);
  const [miasto, setMiasto] = useState(miasta[0] ?? "");
  const [typ, setTyp] = useState<TypUslugodawcy>("weterynarz");
  const [lista, setLista] = useState<Uslugodawca[]>([]);

  useEffect(() => {
    if (!miasto) return;
    fetchProviders(miasto, typ).then((wynik) => setLista(rankingPoOpiniach(wynik)));
  }, [miasto, typ]);

  return (
    <main className="py-6">
      <Link href="/" className="mb-4 inline-block text-sm text-primary/60">
        ← strona główna
      </Link>

      <h1 className="mb-1 text-xl font-bold text-primary">Weterynarze i fryzjerzy</h1>
      <p className="mb-5 text-sm text-primary/60">
        Ranking według ocen — wybierz miasto i kategorię.
      </p>

      <select
        className="mb-3 w-full rounded-2xl border border-linia bg-white px-4 py-3 text-primary outline-none focus:border-primary"
        value={miasto}
        onChange={(e) => setMiasto(e.target.value)}
      >
        {miasta.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTyp("weterynarz")}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            typ === "weterynarz" ? "border-primary bg-primary text-tlo" : "border-linia bg-white text-primary"
          }`}
        >
          🩺 Weterynarze
        </button>
        <button
          type="button"
          onClick={() => setTyp("fryzjer")}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            typ === "fryzjer" ? "border-primary bg-primary text-tlo" : "border-linia bg-white text-primary"
          }`}
        >
          ✂️ Fryzjerzy
        </button>
      </div>

      {lista.length === 0 && (
        <p className="text-center text-sm text-primary/50">Brak danych dla tego miasta — wkrótce dodamy więcej.</p>
      )}

      {lista.map((u, i) => (
        <KartaUslugodawcy key={u.id} uslugodawca={u} miejsce={i + 1} />
      ))}

      <p className="mt-4 text-center text-xs text-primary/40">
        Dane przykładowe (demo). Ranking uwzględnia ocenę średnią oraz liczbę opinii.
      </p>
    </main>
  );
}
