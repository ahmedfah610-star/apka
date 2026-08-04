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
  return (
    <span className="font-medium text-ink underline decoration-dotted decoration-akcent/70 underline-offset-2">
      {children}
    </span>
  );
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

// Wyróżniona ramka (np. dane sprzedawcy, wzór formularza, ważna informacja).
export function Ramka({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-linia bg-szary/40 p-4 text-[14.5px] leading-relaxed text-ink-2 sm:p-5">
      {children}
    </div>
  );
}

// Jednolity blok danych sprzedawcy — jedno miejsce do uzupełnienia danych rejestrowych.
export function DaneSprzedawcy() {
  return (
    <Ramka>
      <p className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-2">Sprzedawca</p>
      <p className="text-ink">
        Sklep internetowy <strong>bobas-shopping</strong> prowadzony jest przez{" "}
        <strong>AMIN.KIDS Sp. z o.o.</strong>
        <br />
        ul. Tomasza Zana 43/2.1, 20-601 Lublin, Polska
        <br />
        NIP <Placeholder>[NIP]</Placeholder> · REGON <Placeholder>[REGON]</Placeholder> · KRS <Placeholder>[KRS]</Placeholder>
      </p>
      <p className="mt-2 text-ink">
        E-mail: <a href="mailto:amin.kids1@hotmail.com" className="underline underline-offset-2 hover:text-akcent">amin.kids1@hotmail.com</a>
        <br />
        Telefon: <Placeholder>[telefon — opcjonalnie]</Placeholder>
      </p>
    </Ramka>
  );
}
