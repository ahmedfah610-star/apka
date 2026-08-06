import Link from "next/link";
import { KOLEKCJE } from "@/data/kolekcje";

// Wybrane kolekcje do linkowania wewnętrznego w stopce (SEO — na każdej stronie).
const POPULARNE = [
  "spodnie-dla-chlopca",
  "spodnie-dla-dziewczynki",
  "bluzy-dla-chlopca",
  "sukienki-dla-dziewczynki",
  "body-niemowlece",
  "komplety-dzieciece",
  "dresy-dzieciece",
  "czapki-dzieciece",
]
  .map((s) => KOLEKCJE.find((k) => k.slug === s))
  .filter((k): k is (typeof KOLEKCJE)[number] => !!k);

export function Stopka() {
  return (
    <footer className="border-t border-linia px-6 py-14 md:px-12">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <span className="text-xl font-bold tracking-tight">bobas-shopping</span>
          <p className="mt-3 max-w-[220px] text-sm text-ink-2">
            Ubrania dla dzieci 0-12 lat. Miękkie, bezpieczne i gotowe do zabawy.
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <a
              href="https://www.facebook.com/BobasShopping/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook — bobas-shopping"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-linia-2 text-ink transition-colors hover:border-ink hover:text-akcent"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3-.04-1.3-.13-2.46-.13-2.44 0-4.11 1.49-4.11 4.22V9.9H7.7V13h2.73v8h3.07z" />
              </svg>
            </a>
            <a
              href="https://allegro.pl/uzytkownik/bobas-shopping"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Allegro — bobas-shopping"
              className="flex h-9 items-center rounded-full border border-linia-2 px-3.5 text-[13px] font-extrabold lowercase tracking-tight text-[#ff5a00] transition-colors hover:border-ink"
            >
              allegro
            </a>
          </div>
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

      <div className="mx-auto mt-10 max-w-content border-t border-linia pt-6">
        <h4 className="mb-3 text-[13px] font-semibold tracking-wide text-ink-2">POPULARNE KATEGORIE</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-2">
          {POPULARNE.map((k) => (
            <Link key={k.slug} href={`/kolekcje/${k.slug}`} className="no-underline hover:text-akcent">
              {k.h1}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-content border-t border-linia pt-6 text-xs text-ink-2">
        <p className="mb-3 leading-relaxed">
          AMIN.KIDS Sp. z o.o. · ul. Tomasza Zana 43/2.1, 20-601 Lublin · NIP 7123438950 · REGON 522694079 · KRS 0000984936
          <br />
          E-mail: <a href="mailto:amin.kids1@hotmail.com" className="no-underline hover:text-akcent">amin.kids1@hotmail.com</a>
        </p>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <span>© 2026 bobas-shopping. Wszystkie prawa zastrzeżone.</span>
          <span className="flex items-center gap-4">
            <Link href="/regulamin" className="no-underline hover:text-akcent">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="no-underline hover:text-akcent">Prywatność</Link>
            <Link href="/admin" className="no-underline hover:text-akcent">Panel</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
