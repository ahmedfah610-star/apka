import Link from "next/link";
import { HeroTlo } from "@/components/HeroTlo";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, oklch(98% 0.01 80) 0%, oklch(95% 0.028 45) 100%)" }}
    >
      {/* Zdjęcie tła (jeśli wgrane); w innym wypadku widać animowane tło poniżej */}
      <HeroTlo />

      {/* Subtelna, premium animacja — rozmyte plamy koloru w palecie marki */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          style={{
            position: "absolute",
            top: "-14%",
            right: "-6%",
            width: 540,
            height: 540,
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(84% 0.09 40) 0%, transparent 68%)",
            filter: "blur(24px)",
            opacity: 0.55,
            animation: "orbA 18s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-24%",
            left: "-10%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, oklch(88% 0.06 125) 0%, transparent 68%)",
            filter: "blur(24px)",
            opacity: 0.5,
            animation: "orbB 22s ease-in-out infinite",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-content px-6 py-20 md:px-12 md:py-40">
        <div className="fade-up max-w-2xl">
          <p className="mb-4 text-[12px] font-semibold tracking-[0.2em] text-akcent md:mb-5 md:text-[13px]">KOLEKCJA LATO 2026</p>
          <h1 className="mb-5 text-[34px] font-bold leading-[1.05] tracking-tight text-ink sm:text-[44px] md:mb-6 md:text-[64px]">
            Ubrania, w których dzieci mogą być sobą
          </h1>
          <p className="mb-8 max-w-lg text-[15px] font-medium leading-relaxed text-ink md:mb-9 md:text-[16px]">
            Miękkie, bezpieczne i gotowe na każdą przygodę — od pierwszych chwil po pierwszy dzień w przedszkolu.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/produkty"
              className="inline-block rounded-xl bg-ink px-9 py-4 text-center text-[13px] font-semibold tracking-wide text-tlo no-underline shadow-lg transition-all hover:-translate-y-0.5 hover:bg-akcent hover:shadow-xl"
            >
              ZOBACZ KOLEKCJĘ
            </Link>
            <Link
              href="/produkty?kategoria=niemowleta"
              className="inline-block rounded-xl border-[1.5px] border-ink bg-tlo/85 px-9 py-4 text-center text-[13px] font-semibold tracking-wide text-ink no-underline backdrop-blur-sm transition-colors hover:bg-ink hover:text-tlo"
            >
              DLA NIEMOWLĄT
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
