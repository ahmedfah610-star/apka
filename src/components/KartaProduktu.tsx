import Link from "next/link";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";

export function KartaProduktu({ produkt }: { produkt: Produkt }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${produkt.hue}) 0 18px, oklch(95% 0.01 ${produkt.hue}) 18px 36px)`,
  };

  return (
    <Link href={`/produkty/${produkt.id}`} className="group block text-inherit no-underline">
      <div
        className="relative mb-3.5 flex h-[320px] items-center justify-center overflow-hidden bg-white"
        style={produkt.zdjecie ? undefined : placeholder}
      >
        {produkt.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={produkt.zdjecie}
            alt={produkt.nazwa}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <span className="absolute bottom-3 left-3 bg-white/85 px-2 py-1 font-mono text-[11px] text-[oklch(30%_0.02_40)]">
            zdjęcie produktu
          </span>
        )}
        {produkt.badge ? (
          <span className="absolute left-3 top-3 bg-ink px-[9px] py-[5px] text-[11px] tracking-wide text-tlo">
            {produkt.badge}
          </span>
        ) : null}
        {produkt.stan === 0 ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/65 text-[12px] font-semibold uppercase tracking-wide text-ink">
            Niedostępny
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 text-[15px] font-semibold transition-colors group-hover:text-akcent">{produkt.nazwa}</h3>
      <p className="mb-1 text-[13px] text-[oklch(50%_0.01_90)]">{produkt.wiekLabel}</p>
      <p className="text-[15px] text-ink-3">{formatCena(produkt.cena)} zł</p>
    </Link>
  );
}
