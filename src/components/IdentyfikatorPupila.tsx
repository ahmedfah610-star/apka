import type { ProfilPupila } from "@/types/domain";

interface Props {
  profil: ProfilPupila;
  krok: number;
  liczbaKrokow: number;
}

// "Zawieszka na obroży" widoczna u góry kreatora — wypełnia się danymi pupila krok po kroku.
export function IdentyfikatorPupila({ profil, krok, liczbaKrokow }: Props) {
  const emoji = profil.gatunek === "kot" ? "🐱" : "🐶";

  return (
    <div className="pt-6 pb-4">
      <div className="mb-3 h-2 w-full rounded-full bg-linia">
        <div
          className="h-2 rounded-full bg-akcent transition-all"
          style={{ width: `${(krok / liczbaKrokow) * 100}%` }}
        />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-linia bg-white px-4 py-3 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-szalwia/30 text-2xl">
          {emoji}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-primary">
            {profil.imie || "Twój pupil"}
          </p>
          <p className="truncate text-xs text-primary/60">
            {[profil.rasa, profil.wiekLat ? `${profil.wiekLat} lat` : null, profil.wagaKg ? `${profil.wagaKg} kg` : null]
              .filter(Boolean)
              .join(" • ") || "wypełniamy profil…"}
          </p>
        </div>
      </div>
    </div>
  );
}
