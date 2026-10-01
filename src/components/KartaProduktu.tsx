import Link from "next/link";
import type { Produkt } from "@/data/produkty";
import { formatCena } from "@/lib/filtrowanie";
import { PrzyciskUlubione } from "@/components/PrzyciskUlubione";
import { EdycjaProduktu } from "@/components/TrybAdmina";

// Jedna karta produktu w całym sklepie (lista, kolekcje, strona główna, „Zobacz też"):
// zdjęcie, cena na pierwszym planie, nazwa, dostępne rozmiary i liczba kolorów.
export function KartaProduktu({ produkt, liczbaKolorow, cenaOd }: { produkt: Produkt; liczbaKolorow?: number; cenaOd?: number }) {
  const placeholder = {
    background: `repeating-linear-gradient(115deg, oklch(90% 0.02 ${produkt.hue}) 0 18px, oklch(95% 0.01 ${produkt.hue}) 18px 36px)`,
  };
  const niedostepny = produkt.stan === 0;
  // Tylko prawdziwie ostatnia sztuka — przy progu 5 etykieta wisiała na 95% produktów i nic nie znaczyła.
  const ostatnia = produkt.stan === 1;
  const roz = produkt.rozmiary ?? [];
  const rozmiary = roz.length ? `Rozm. ${roz.slice(0, 4).join(", ")}${roz.length > 4 ? " …" : ""}` : produkt.wiekLabel;

  return (
    <Link
      href={`/produkty/${produkt.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-linia bg-white text-inherit no-underline transition-shadow hover:shadow-[0_10px_28px_-16px_rgba(0,0,0,0.35)]"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden" style={produkt.zdjecie ? undefined : placeholder}>
        <PrzyciskUlubione id={produkt.id} />
        <EdycjaProduktu produkt={produkt} wariant="karta" />
        {produkt.zdjecie ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={produkt.zdjecie}
            alt={produkt.nazwa}
            className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <span className="absolute bottom-3 left-3 rounded bg-white/85 px-2 py-1 font-mono text-[11px] text-[oklch(30%_0.02_40)]">
            zdjęcie produktu
          </span>
        )}
        {produkt.badge ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">{produkt.badge}</span>
        ) : null}
        {niedostepny ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-[13px] font-bold text-ink backdrop-blur-[1px]">
            Niedostępny
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-1">
        <p className="text-[17px] font-extrabold tracking-tight text-ink md:text-[18px]">
          {cenaOd ? <span className="text-[13px] font-semibold text-ink-2">od </span> : null}
          {formatCena(cenaOd ?? produkt.cena)} zł
        </p>
        <h3 className="mb-2 mt-0.5 line-clamp-2 min-h-[2.7em] text-[13.5px] font-medium leading-snug text-ink group-hover:text-akcent md:text-[14px]">
          {produkt.nazwa}
        </h3>
        <p className="mt-auto truncate border-t border-linia pt-2 text-[12px] text-ink-2">
          {ostatnia ? <span className="font-bold text-cena">Ostatnia sztuka · </span> : null}
          {rozmiary}
          {liczbaKolorow && liczbaKolorow > 1 ? ` · ${liczbaKolorow} ${liczbaKolorow <= 4 ? "kolory" : "kolorów"}` : ""}
        </p>
      </div>
    </Link>
  );
}
