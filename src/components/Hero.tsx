import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, oklch(98% 0.01 80) 0%, oklch(95% 0.028 45) 100%)" }}
    >
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

      <div className="relative mx-auto max-w-content px-6 py-28 md:px-12 md:py-40">
        <div className="fade-up max-w-2xl">
          <p className="mb-5 text-[13px] tracking-[0.2em] text-ink-2">KOLEKCJA LATO 2026</p>
          <h1 className="mb-6 text-[44px] font-bold leading-[1.02] tracking-tight md:text-[64px]">
            Ubrania, w których dzieci mogą być sobą
          </h1>
          <p className="mb-9 max-w-lg text-[16px] leading-relaxed text-ink-2">
            Miękkie, bezpieczne i gotowe na każdą przygodę — od pierwszych chwil po pierwszy dzień w przedszkolu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produkty"
              className="inline-block bg-ink px-9 py-4 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
            >
              ZOBACZ KOLEKCJĘ
            </Link>
            <Link
              href="/produkty?kategoria=niemowleta"
              className="inline-block border border-ink px-9 py-4 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:bg-ink hover:text-tlo"
            >
              DLA NIEMOWLĄT
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
