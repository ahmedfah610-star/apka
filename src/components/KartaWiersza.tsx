import Link from "next/link";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";

// Kompaktowa karta do rzędów na stronie głównej: cena na pierwszym planie,
// nazwa i dostępne rozmiary — jak w sprawnych sklepach internetowych.
export function KartaWiersza({ produkt: p, cenaOd, kolory }: { produkt: Produkt; cenaOd?: number; kolory?: number }) {
  const roz = p.rozmiary ?? [];
  return (
    <Link
      href={`/produkty/${p.id}`}
      className="group flex h-full flex-col rounded-xl border border-linia bg-white p-3 text-inherit no-underline transition-shadow hover:shadow-[0_10px_28px_-16px_rgba(0,0,0,0.35)]"
    >
      <div className="mb-2.5 flex aspect-square items-center justify-center overflow-hidden">
        {p.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.zdjecie} alt={p.nazwa} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]" />
        ) : null}
      </div>
      <p className="text-[18px] font-extrabold tracking-tight text-ink">
        {cenaOd ? <span className="text-[13px] font-semibold text-ink-2">od </span> : null}
        {formatCena(cenaOd ?? p.cena)} zł
      </p>
      <p className="mb-2 mt-0.5 line-clamp-2 min-h-[2.7em] text-[13.5px] leading-snug text-ink group-hover:text-akcent">{p.nazwa}</p>
      <p className="mt-auto truncate border-t border-linia pt-2 text-[12px] text-ink-2">
        {roz.length ? `Rozm. ${roz.slice(0, 5).join(", ")}${roz.length > 5 ? " …" : ""}` : "Rozmiar uniwersalny"}
        {kolory && kolory > 1 ? ` · ${kolory} ${kolory <= 4 ? "kolory" : "kolorów"}` : ""}
      </p>
    </Link>
  );
}
