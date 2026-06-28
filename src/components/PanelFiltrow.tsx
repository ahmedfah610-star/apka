"use client";

export interface Filtry {
  cenaOd: number | null;
  cenaDo: number | null;
  sklep: string | null;
  tylkoDostawa24h: boolean;
  tylkoDostepne: boolean;
  sortowanie: "dopasowanie" | "cena";
}

export const FILTRY_DOMYSLNE: Filtry = {
  cenaOd: null,
  cenaDo: null,
  sklep: null,
  tylkoDostawa24h: false,
  tylkoDostepne: true,
  sortowanie: "dopasowanie",
};

interface Props {
  filtry: Filtry;
  onChange: (f: Filtry) => void;
  sklepy: string[];
}

export function PanelFiltrow({ filtry, onChange, sklepy }: Props) {
  return (
    <div className="mb-5 rounded-2xl border border-linia bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-primary">Filtry</p>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Cena od (zł, z dostawą)"
          className="rounded-xl border border-linia px-3 py-2 text-sm outline-none focus:border-primary"
          value={filtry.cenaOd ?? ""}
          onChange={(e) => onChange({ ...filtry, cenaOd: e.target.value ? Number(e.target.value) : null })}
        />
        <input
          type="number"
          placeholder="Cena do (zł, z dostawą)"
          className="rounded-xl border border-linia px-3 py-2 text-sm outline-none focus:border-primary"
          value={filtry.cenaDo ?? ""}
          onChange={(e) => onChange({ ...filtry, cenaDo: e.target.value ? Number(e.target.value) : null })}
        />
      </div>

      <select
        className="mb-3 w-full rounded-xl border border-linia px-3 py-2 text-sm outline-none focus:border-primary"
        value={filtry.sklep ?? ""}
        onChange={(e) => onChange({ ...filtry, sklep: e.target.value || null })}
      >
        <option value="">Wszystkie sklepy</option>
        {sklepy.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="mb-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-primary">
          <input
            type="checkbox"
            checked={filtry.tylkoDostawa24h}
            onChange={(e) => onChange({ ...filtry, tylkoDostawa24h: e.target.checked })}
          />
          Dostawa 24h
        </label>
        <label className="flex items-center gap-2 text-sm text-primary">
          <input
            type="checkbox"
            checked={filtry.tylkoDostepne}
            onChange={(e) => onChange({ ...filtry, tylkoDostepne: e.target.checked })}
          />
          Tylko dostępne
        </label>
      </div>

      <select
        className="w-full rounded-xl border border-linia px-3 py-2 text-sm outline-none focus:border-primary"
        value={filtry.sortowanie}
        onChange={(e) => onChange({ ...filtry, sortowanie: e.target.value as Filtry["sortowanie"] })}
      >
        <option value="dopasowanie">Sortuj: najlepsze dopasowanie</option>
        <option value="cena">Sortuj: najniższa cena</option>
      </select>
    </div>
  );
}
