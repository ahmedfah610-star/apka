// Pasek kroków zamówienia. aktywny: 0=Koszyk, 1=Konto, 2=Dane i dostawa, 3=Gotowe.
const KROKI = ["Koszyk", "Konto", "Dane i dostawa", "Gotowe"];

export function KrokiZamowienia({ aktywny }: { aktywny: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2 text-[12px] sm:gap-3 sm:text-[13px]">
      {KROKI.map((k, i) => (
        <li key={k} className="flex flex-1 items-center gap-2 sm:gap-3">
          <span className={`flex items-center gap-2 whitespace-nowrap ${i === aktywny ? "font-semibold text-ink" : "text-ink-2"}`}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                i < aktywny ? "bg-[oklch(66%_0.13_150)] text-tlo" : i === aktywny ? "bg-ink text-tlo" : "bg-szary text-ink-2"
              }`}
            >
              {i < aktywny ? "✓" : i + 1}
            </span>
            <span className={i !== aktywny ? "hidden sm:inline" : ""}>{k}</span>
          </span>
          {i < KROKI.length - 1 ? <span className="h-px flex-1 bg-linia" /> : null}
        </li>
      ))}
    </ol>
  );
}
