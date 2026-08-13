import { KOMUNIKAT_PRZERWY } from "@/lib/sklep";

// Notka o przerwie technicznej (wstrzymane zamówienia).
export function PrzerwaTechniczna({ className }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-akcent/40 bg-akcent/[0.06] p-4 sm:p-5 ${className ?? ""}`}>
      <p className="flex items-center gap-2 text-[14px] font-bold text-akcent">
        <span aria-hidden>🔧</span> Prace techniczne
      </p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{KOMUNIKAT_PRZERWY}</p>
    </div>
  );
}
