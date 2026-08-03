import { StronaInfo } from "@/components/StronaInfo";

export const metadata = { title: "FAQ — najczęstsze pytania — Fasolka" };

const PYTANIA: { q: string; a: React.ReactNode }[] = [
  { q: "Jak dobrać rozmiar?", a: "Rozmiar odpowiada wzrostowi dziecka w centymetrach. Skorzystaj z tabeli rozmiarów dostępnej na karcie każdego produktu. Jeśli dziecko jest pomiędzy rozmiarami — wybierz większy." },
  { q: "Jakie są sposoby dostawy?", a: "Wysyłamy przez InPost (Paczkomaty 24/7 i kurier) oraz kurierem standardowym. Szczegóły i koszty znajdziesz na stronie „Dostawa i zwroty”." },
  { q: "Jak długo czekam na paczkę?", a: "Zwykle kilka dni roboczych od zaksięgowania płatności. Dokładny czas realizacji podajemy w zakładce dostawy." },
  { q: "Czy mogę zwrócić towar?", a: "Tak — masz 14 dni na zwrot bez podania przyczyny. Zasady i wzór formularza znajdziesz na stronie „Dostawa i zwroty”." },
  { q: "Jak zapłacić?", a: "Udostępniamy BLIK, kartę płatniczą i Przelewy24 (płatność online). Zamówienie realizujemy po zaksięgowaniu wpłaty." },
  { q: "Jak zgłosić reklamację?", a: "Napisz do nas na adres e-mail podany w Kontakcie, opisując wadę i podając numer zamówienia. Odpowiemy w ciągu 14 dni." },
  { q: "Czy wystawiacie fakturę?", a: "Tak, na życzenie. Zaznacz taką potrzebę w zamówieniu lub napisz do nas z danymi do faktury." },
];

export default function Faq() {
  return (
    <StronaInfo tytul="Najczęstsze pytania" wstep="Krótkie odpowiedzi na to, o co pytacie najczęściej.">
      <div className="flex flex-col divide-y divide-linia border-y border-linia">
        {PYTANIA.map((p) => (
          <details key={p.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold">
              {p.q}
              <span className="text-ink-2 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{p.a}</p>
          </details>
        ))}
      </div>
    </StronaInfo>
  );
}
