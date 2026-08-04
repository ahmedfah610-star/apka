import Link from "next/link";

export function Stopka() {
  return (
    <footer className="border-t border-linia px-6 py-14 md:px-12">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <span className="text-xl font-bold tracking-tight">bobas-shopping</span>
          <p className="mt-3 max-w-[220px] text-sm text-ink-2">
            Ubrania dla dzieci 0-12 lat. Miękkie, bezpieczne i gotowe do zabawy.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">SKLEP</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-2">
            <li><Link href="/produkty?kategoria=dziewczynki" className="no-underline hover:text-akcent">Dziewczynki</Link></li>
            <li><Link href="/produkty?kategoria=chlopcy" className="no-underline hover:text-akcent">Chłopcy</Link></li>
            <li><Link href="/produkty?kategoria=niemowleta" className="no-underline hover:text-akcent">Niemowlęta</Link></li>
            <li><Link href="/produkty" className="no-underline hover:text-akcent">Wszystkie produkty</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">OBSŁUGA</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-2">
            <li><Link href="/dostawa-i-zwroty" className="no-underline hover:text-akcent">Dostawa i zwroty</Link></li>
            <li><Link href="/faq" className="no-underline hover:text-akcent">FAQ</Link></li>
            <li><Link href="/blog" className="no-underline hover:text-akcent">Blog</Link></li>
            <li><Link href="/kontakt" className="no-underline hover:text-akcent">Kontakt</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">INFORMACJE</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-2">
            <li><Link href="/o-nas" className="no-underline hover:text-akcent">O nas</Link></li>
            <li><Link href="/regulamin" className="no-underline hover:text-akcent">Regulamin</Link></li>
            <li><Link href="/polityka-prywatnosci" className="no-underline hover:text-akcent">Polityka prywatności</Link></li>
            <li><Link href="/cookies" className="no-underline hover:text-akcent">Polityka cookies</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-content flex-col items-start justify-between gap-3 border-t border-linia pt-6 text-xs text-ink-2 sm:flex-row sm:items-center">
        <span>© 2026 bobas-shopping. Wszystkie prawa zastrzeżone.</span>
        <span className="flex items-center gap-4">
          <Link href="/regulamin" className="no-underline hover:text-akcent">Regulamin</Link>
          <Link href="/polityka-prywatnosci" className="no-underline hover:text-akcent">Prywatność</Link>
          <Link href="/admin" className="no-underline hover:text-akcent">Panel</Link>
        </span>
      </div>
    </footer>
  );
}
