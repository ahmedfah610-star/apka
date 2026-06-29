"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProviders, rankingPoOpiniach } from "@/lib/providersService";
import { listaMiast } from "@/data/uslugodawcy";
import { KartaUslugodawcy } from "@/components/KartaUslugodawcy";
import type { TypUslugodawcy, Uslugodawca } from "@/types/domain";

export default function SpecjalisciPage() {
  const miastaPodpowiedzi = useMemo(() => listaMiast(), []);
  const [miasto, setMiasto] = useState(miastaPodpowiedzi[0] ?? "");
  const [typ, setTyp] = useState<TypUslugodawcy>("weterynarz");
  const [lista, setLista] = useState<Uslugodawca[]>([]);
  const [zrodlo, setZrodlo] = useState<"google" | "demo">("demo");
  const [stan, setStan] = useState<"ladowanie" | "gotowe">("ladowanie");

  useEffect(() => {
    if (!miasto.trim()) return;
    setStan("ladowanie");
    fetchProviders(miasto.trim(), typ).then(({ source, wyniki }) => {
      setZrodlo(source);
      setLista(rankingPoOpiniach(wyniki));
      setStan("gotowe");
    });
  }, [miasto, typ]);

  return (
    <main className="py-6">
      <Link href="/" className="mb-4 inline-block text-sm text-primary/60">
        ← strona główna
      </Link>

      <h1 className="mb-1 text-xl font-bold text-primary">Weterynarze i fryzjerzy</h1>
      <p className="mb-5 text-sm text-primary/60">
        Ranking według ocen — wpisz miasto i wybierz kategorię.
      </p>

      <input
        list="miasta-podpowiedzi"
        className="mb-3 w-full rounded-2xl border border-linia bg-white px-4 py-3 text-primary outline-none focus:border-primary"
        placeholder="Miasto, np. Warszawa"
        value={miasto}
        onChange={(e) => setMiasto(e.target.value)}
      />
      <datalist id="miasta-podpowiedzi">
        {miastaPodpowiedzi.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

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

      {stan === "ladowanie" && <p className="text-center text-sm text-primary/50">Szukamy…</p>}

      {stan === "gotowe" && lista.length === 0 && (
        <p className="text-center text-sm text-primary/50">
          Brak wyników dla „{miasto}”. Sprawdź nazwę miasta lub spróbuj innej kategorii.
        </p>
      )}

      {stan === "gotowe" &&
        lista.map((u, i) => <KartaUslugodawcy key={u.id} uslugodawca={u} miejsce={i + 1} />)}

      <p className="mt-4 text-center text-xs text-primary/40">
        {zrodlo === "google"
          ? "Dane z Google: oceny i opinie realnych klientów."
          : "Dane przykładowe (demo) — skonfiguruj GOOGLE_PLACES_API_KEY, aby pokazać realne miejsca."}{" "}
        Ranking uwzględnia ocenę średnią oraz liczbę opinii.
      </p>
    </main>
  );
}
