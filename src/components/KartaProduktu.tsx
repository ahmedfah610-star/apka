import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";

export function KartaProduktu({ produkt }: { produkt: Produkt }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${produkt.hue}) 0 18px, oklch(95% 0.01 ${produkt.hue}) 18px 36px)`,
  };

  return (
    <article className="fade-up">
      <div className="relative mb-3.5 h-[300px] overflow-hidden" style={produkt.zdjecie ? undefined : placeholder}>
        {produkt.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={produkt.zdjecie} alt={produkt.nazwa} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="absolute bottom-3 left-3 bg-white/85 px-2 py-1 font-mono text-[11px] text-[oklch(30%_0.02_40)]">
            zdjęcie produktu
          </span>
        )}
        {produkt.badge ? (
          <span className="absolute left-3 top-3 bg-tlo px-[9px] py-[5px] text-[11px] tracking-wide text-ink">
            {produkt.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 text-[15px] font-semibold">{produkt.nazwa}</h3>
      <p className="mb-1 text-[13px] text-[oklch(50%_0.01_90)]">{produkt.wiekLabel}</p>
      <p className="text-[15px] text-ink-3">{formatCena(produkt.cena)} zł</p>
    </article>
  );
}
