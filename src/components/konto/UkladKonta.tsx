import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";

// Wyśrodkowany układ dla stron konta (logowanie, panel, zamówienia).
// `waskie` — wąska kolumna na kartę logowania; domyślnie szersza na panel.
export function UkladKonta({ waskie, children }: { waskie?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-szary/25">
      <Nawigacja />
      <main className="flex flex-1 flex-col items-center px-5 py-10 sm:px-6 md:py-16">
        <div className={`w-full ${waskie ? "max-w-md" : "max-w-3xl"}`}>{children}</div>
      </main>
      <Stopka />
    </div>
  );
}
