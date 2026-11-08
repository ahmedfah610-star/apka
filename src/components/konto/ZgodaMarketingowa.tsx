"use client";

// Zgoda na kody rabatowe i nowości e-mailem — przy zakładaniu konta. Domyślnie NIEzaznaczona
// (wymóg prawa: zgoda musi być dobrowolna i aktywna). Bez niej nie wysyłamy kodu powitalnego.
export function ZgodaMarketingowa({ zaznaczona, onZmiana }: { zaznaczona: boolean; onZmiana: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-linia bg-szary/30 px-3 py-2.5 text-left text-[12.5px] leading-snug text-ink-2">
      <input
        type="checkbox"
        checked={zaznaczona}
        onChange={(e) => onZmiana(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--akcent)]"
      />
      <span>
        <strong className="text-ink">Chcę otrzymywać kody rabatowe i nowości e-mailem.</strong> Zgodę możesz wycofać w każdej chwili.{" "}
        <a href="/polityka-prywatnosci" target="_blank" className="underline underline-offset-2">
          Więcej
        </a>
      </span>
    </label>
  );
}
