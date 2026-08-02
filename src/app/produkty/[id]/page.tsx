import type { Metadata } from "next";
import Link from "next/link";
import { Nawigacja } from "@/components/Nawigacja";
import { Stopka } from "@/components/Stopka";
import { WidokProduktu } from "@/components/WidokProduktu";
import { opisProduktu } from "@/data/produkty";
import { katalogWidoczny, znajdzProduktDb } from "@/lib/produktyDb";

// Strona produktu czytana z bazy przy żądaniu (świeże ceny/stany, także dla
// pozycji dodanych w panelu). Bez bazy — fallback do katalogu z kodu.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await znajdzProduktDb(params.id);
  if (!p) return { title: "Produkt — Fasolka" };
  return { title: `${p.nazwa} — Fasolka`, description: opisProduktu(p) };
}

export default async function StronaProduktu({ params }: { params: { id: string } }) {
  const [p, wszystkie] = await Promise.all([znajdzProduktDb(params.id), katalogWidoczny()]);

  if (!p) {
    return (
      <div className="overflow-x-hidden">
        <Nawigacja aktywna="produkty" />
        <div className="mx-auto max-w-content px-6 py-24 text-center md:px-12">
          <p className="mb-2 text-[17px] font-semibold">Nie znaleziono produktu</p>
          <p className="mb-6 text-sm text-ink-2">Ten produkt nie istnieje lub został usunięty.</p>
          <Link href="/produkty" className="inline-block bg-ink px-8 py-3.5 text-[13px] font-semibold tracking-wide text-tlo no-underline hover:bg-akcent">
            WRÓĆ DO PRODUKTÓW
          </Link>
        </div>
        <Stopka />
      </div>
    );
  }

  return <WidokProduktu produkt={p} wszystkie={wszystkie} />;
}
