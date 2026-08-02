import Link from "next/link";

export function Stopka() {
  return (
    <footer className="border-t border-linia px-6 py-14 md:px-12">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <span className="text-xl font-bold tracking-tight">Fasolka</span>
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
            <li>Dostawa i zwroty</li>
            <li>Tabela rozmiarów</li>
            <li>Kontakt</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">ŚLEDŹ NAS</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-2">
            <li>Instagram</li>
            <li>Facebook</li>
            <li>Allegro</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-content text-xs text-ink-2">© 2026 Fasolka. Wszystkie prawa zastrzeżone.</p>
    </footer>
  );
}
