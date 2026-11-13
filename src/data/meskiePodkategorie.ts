// Podkategorie działu „Męskie" — w pasku kategorii (komputer: menu pod „Męskie", telefon: osobne
// zakładki) i w menu bocznym. Każda to kolekcja z data/kolekcje.ts (produkty dobierane po nazwie).
export const MESKIE_PODKATEGORIE: { label: string; href: string; opis?: string; wPasku?: boolean }[] = [
  { label: "Męskie swetry", href: "/kolekcje/swetry-meskie", opis: "rozpinane, półgolfy, ocieplane", wPasku: true },
  { label: "Męskie bluzy", href: "/kolekcje/bluzy-meskie", opis: "z kapturem i bez", wPasku: true },
  { label: "Męskie dresy", href: "/kolekcje/spodnie-dresowe-meskie", opis: "spodnie dresowe, także ocieplane", wPasku: true },
];
