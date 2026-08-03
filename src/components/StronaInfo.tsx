import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";

// Wspólny układ dla stron informacyjnych i prawnych (czytelna kolumna tekstu).
export function StronaInfo({
  tytul,
  wstep,
  aktualizacja,
  children,
}: {
  tytul: string;
  wstep?: string;
  aktualizacja?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-hidden">
      <Nawigacja />
      <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-6 md:py-16">
        <h1 className="mb-3 text-[30px] font-bold tracking-tight md:text-[38px]">{tytul}</h1>
        {wstep ? <p className="mb-2 text-[16px] leading-relaxed text-ink-2">{wstep}</p> : null}
        {aktualizacja ? <p className="mb-8 text-[13px] text-ink-2">Ostatnia aktualizacja: {aktualizacja}</p> : <div className="mb-8" />}
        <div className="tresc flex flex-col gap-5 text-[15px] leading-relaxed text-ink">{children}</div>
      </div>
      <Stopka />
    </div>
  );
}

// Pomocnicze elementy do składania treści.
export function Sekcja({ tytul, children }: { tytul: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="mt-3 text-[19px] font-bold tracking-tight">{tytul}</h2>
      {children}
    </section>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-[oklch(92%_0.09_95)] px-1.5 py-0.5 font-medium text-[oklch(40%_0.1_75)]">{children}</span>;
}

export function Lista({ punkty }: { punkty: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-ink-2">
      {punkty.map((p, i) => (
        <li key={i}>{p}</li>
      ))}
    </ul>
  );
}
