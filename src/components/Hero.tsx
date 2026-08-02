import Link from "next/link";
import { znajdzProdukt } from "@/data/produkty";

const KOLAZ = [
  { id: "dres-2-czesciowy-rozowy", top: "6%", left: "6%", rot: -5, dur: "6s", delay: "0s" },
  { id: "spodnie-dresowe-sportowe", top: "34%", left: "40%", rot: 4, dur: "7.5s", delay: "0.6s" },
  { id: "komplet-dresowy-mis", top: "8%", left: "58%", rot: 6, dur: "6.8s", delay: "1.1s" },
];

const BALONY = [
  { c: "oklch(70% 0.15 20)", left: "8%", top: "14%", dur: "7s", delay: "0s" },
  { c: "oklch(72% 0.13 260)", left: "20%", top: "26%", dur: "8.5s", delay: "0.8s" },
  { c: "oklch(78% 0.13 130)", left: "30%", top: "10%", dur: "9s", delay: "0.3s" },
];

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: 660,
        background: "linear-gradient(160deg, oklch(97% 0.02 70) 0%, oklch(95% 0.04 40) 55%, oklch(93% 0.05 30) 100%)",
      }}
    >
      {/* Dekoracje — animowana scena */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Słońce */}
        <div
          className="absolute"
          style={{
            top: 60,
            right: 90,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 40%, oklch(90% 0.13 85), oklch(80% 0.16 70))",
            animation: "pulseSun 6s ease-in-out infinite",
          }}
        />
        {/* Chmurki */}
        <div style={{ position: "absolute", top: 90, left: "12%", animation: "drift 9s ease-in-out infinite alternate" }}>
          <Chmurka />
        </div>
        <div style={{ position: "absolute", top: 160, right: "26%", opacity: 0.85, animation: "drift 12s ease-in-out infinite alternate-reverse" }}>
          <Chmurka />
        </div>
        {/* Balony */}
        {BALONY.map((b, i) => (
          <div
            key={i}
            style={{ position: "absolute", left: b.left, top: b.top, animation: `swingBalloon ${b.dur} ease-in-out ${b.delay} infinite` }}
          >
            <div style={{ width: 34, height: 42, borderRadius: "50%", background: b.c }} />
            <div style={{ width: 1, height: 46, background: "oklch(60% 0.02 90)", margin: "0 auto" }} />
          </div>
        ))}
        {/* Trawa/wzgórze na dole */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ height: 120, background: "oklch(88% 0.07 140)", clipPath: "ellipse(75% 100% at 50% 100%)", opacity: 0.6 }}
        />
      </div>

      {/* Treść */}
      <div className="relative mx-auto grid max-w-content grid-cols-1 items-center gap-8 px-6 py-24 md:grid-cols-2 md:px-12">
        <div className="fade-up">
          <p className="mb-4 text-[13px] tracking-[0.14em] text-ink-2">KOLEKCJA LATO 2026</p>
          <h1 className="mb-6 text-[40px] font-bold leading-[1.04] tracking-tight md:text-[54px]">
            Ubrania, w których dzieci mogą być sobą
          </h1>
          <p className="mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">
            Miękkie, wygodne i gotowe na każdą przygodę — od placu zabaw po pierwszy dzień w przedszkolu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produkty"
              className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline transition-colors hover:bg-akcent"
            >
              ZOBACZ KOLEKCJĘ
            </Link>
            <Link
              href="/produkty?kategoria=niemowleta"
              className="inline-block border border-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-ink no-underline transition-colors hover:bg-ink hover:text-tlo"
            >
              DLA NIEMOWLĄT
            </Link>
          </div>
        </div>

        {/* Kolaż zdjęć produktów */}
        <div className="relative hidden h-[440px] md:block">
          {KOLAZ.map((k) => {
            const p = znajdzProdukt(k.id);
            if (!p?.zdjecie) return null;
            return (
              <Link
                key={k.id}
                href={`/produkty/${k.id}`}
                className="absolute block bg-white shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]"
                style={{
                  top: k.top,
                  left: k.left,
                  width: 200,
                  height: 250,
                  transform: `rotate(${k.rot}deg)`,
                  animation: `float ${k.dur} ease-in-out ${k.delay} infinite`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.zdjecie} alt={p.nazwa} className="h-full w-full object-contain p-3" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Chmurka() {
  return (
    <div style={{ position: "relative", width: 110, height: 40 }}>
      <div style={{ position: "absolute", inset: 0, background: "white", borderRadius: 999, opacity: 0.9 }} />
      <div style={{ position: "absolute", top: -18, left: 22, width: 46, height: 46, background: "white", borderRadius: "50%", opacity: 0.9 }} />
      <div style={{ position: "absolute", top: -12, left: 54, width: 38, height: 38, background: "white", borderRadius: "50%", opacity: 0.9 }} />
    </div>
  );
}
