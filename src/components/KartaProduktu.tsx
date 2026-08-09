import Link from "next/link";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { PrzyciskUlubione } from "@/components/PrzyciskUlubione";

export function KartaProduktu({ produkt }: { produkt: Produkt }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${produkt.hue}) 0 18px, oklch(95% 0.01 ${produkt.hue}) 18px 36px)`,
  };
  const niedostepny = produkt.stan === 0;

  return (
    <Link href={`/produkty/${produkt.id}`} className="group block text-inherit no-underline">
      <div
        className="relative mb-3.5 flex h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-linia bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:border-ink/15 group-hover:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.4)]"
        style={produkt.zdjecie ? undefined : placeholder}
      >
        <PrzyciskUlubione id={produkt.id} />
        {produkt.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={produkt.zdjecie}
            alt={produkt.nazwa}
            className="h-full w-full object-contain p-3.5 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <span className="absolute bottom-3 left-3 rounded bg-white/85 px-2 py-1 font-mono text-[11px] text-[oklch(30%_0.02_40)]">
            zdjęcie produktu
          </span>
        )}
        {produkt.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-[5px] text-[10.5px] font-semibold uppercase tracking-wide text-tlo shadow-sm">
            {produkt.badge}
          </span>
        ) : null}
        {niedostepny ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[12px] font-semibold uppercase tracking-wide text-ink backdrop-blur-[1px]">
            Niedostępny
          </span>
        ) : null}
      </div>
      <h3 className="mb-1 text-[15px] font-semibold leading-snug transition-colors group-hover:text-akcent">{produkt.nazwa}</h3>
      <p className="mb-1.5 text-[12.5px] text-[oklch(50%_0.01_90)]">{produkt.wiekLabel}</p>
      <p className="text-[16px] font-bold text-ink">{formatCena(produkt.cena)} zł</p>
    </Link>
  );
}
