import Link from "next/link";

export function Nawigacja({ aktywna }: { aktywna?: "home" | "produkty" }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-linia bg-[oklch(99%_0.003_90/0.92)] px-6 py-[22px] backdrop-blur-md md:px-12">
      <Link href="/" className="text-inherit no-underline">
        <span className="text-2xl font-bold tracking-tight">Fasolka</span>
      </Link>
      <nav className="flex items-center gap-6 md:gap-9">
        <Link
          href="/"
          className={`text-sm tracking-wide no-underline transition-colors hover:text-akcent ${
            aktywna === "home" ? "font-bold text-akcent" : "text-ink"
          }`}
        >
          STRONA GŁÓWNA
        </Link>
        <Link
          href="/produkty"
          className={`text-sm tracking-wide no-underline transition-colors hover:text-akcent ${
            aktywna === "produkty" ? "font-bold text-akcent" : "text-ink"
          }`}
        >
          WSZYSTKIE PRODUKTY
        </Link>
      </nav>
      <div className="flex items-center gap-5" aria-hidden>
        <div className="relative h-[19px] w-5 cursor-pointer">
          <div className="absolute -top-1.5 left-1 h-[9px] w-3 rounded-t-lg border-[1.5px] border-b-0 border-current" />
          <div className="absolute bottom-0 h-3.5 w-5 border-[1.5px] border-current" />
        </div>
      </div>
    </header>
  );
}
