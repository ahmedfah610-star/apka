import { FIRMA, OSWIADCZENIA_SPRZEDAJACEGO, REJESTRACJE_OPAKOWAN } from "@/lib/firma";

// Informacje o sprzedającym i bezpieczeństwie produktu (GPSR, opakowania / ROP) — na stronie każdego produktu.
export function InformacjeSprzedajacego() {
  return (
    <div className="mt-10 rounded-xl border border-linia bg-szary/40 p-5 text-[13.5px] leading-relaxed text-ink-2 md:p-6">
      <h3 className="mb-3 text-[15px] font-bold text-ink">Sprzedający</h3>
      {OSWIADCZENIA_SPRZEDAJACEGO.map((t) => (
        <p key={t} className="mb-2.5">
          {t}
        </p>
      ))}
      <p className="mb-2.5">
        Podmiot odpowiedzialny: <span className="text-ink">{FIRMA.nazwa}</span>, {FIRMA.adres}, e-mail:{" "}
        <a href={`mailto:${FIRMA.email}`} className="underline underline-offset-2 hover:text-akcent">
          {FIRMA.email}
        </a>
      </p>
      <h4 className="mb-1 mt-4 text-[14px] font-bold text-ink">Rejestracja recyklingu opakowań</h4>
      {REJESTRACJE_OPAKOWAN.map((r) => (
        <p key={r.kraj}>
          {r.kraj} • {r.numer}
        </p>
      ))}
    </div>
  );
}
