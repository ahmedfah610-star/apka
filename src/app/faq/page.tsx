import { StronaInfo } from "@/components/StronaInfo";
import { jsonLd } from "@/lib/seo";

export const metadata = { title: "FAQ — najczęstsze pytania" };

const PYTANIA: { q: string; a: string }[] = [
  // Rozmiary
  { q: "Jak dobrać rozmiar ubranka?", a: "Rozmiar odpowiada wzrostowi dziecka w centymetrach — np. rozmiar 92 to ubranko dla dziecka o wzroście około 92 cm, a nie „na 2 lata”. Zmierz dziecko miarką i wybierz rozmiar najbliższy jego wzrostowi. Pełną tabelę znajdziesz na stronie „Tabela rozmiarów” oraz na karcie każdego produktu." },
  { q: "Dziecko jest pomiędzy rozmiarami — który wybrać?", a: "Niemal zawsze wybieraj większy rozmiar. Ubranko posłuży dłużej, a dzieci rosną szybciej, niż zdążą je znosić. Wyjątkiem są body niemowlęce i rzeczy, które muszą dobrze leżeć — te bierz dokładnie na wzrost." },
  { q: "Jaki rozmiar dla noworodka?", a: "Dla noworodka to zwykle rozmiar 56, ale warto mieć też kilka rzeczy w 62 — część dzieci rodzi się większych. Nie kupuj dużo w najmniejszym rozmiarze, bo dziecko szybko z niego wyrośnie." },

  // Zamówienie i płatność
  { q: "Czy muszę zakładać konto, żeby kupić?", a: "Nie. Możesz złożyć zamówienie jako gość — wystarczą dane do wysyłki. Konto jest opcjonalne i daje wygodę: historię zamówień, zapisany koszyk i szybsze zakupy." },
  { q: "Co daje założenie konta?", a: "Historię i podgląd wszystkich zamówień, koszyk i ulubione zapisane na każdym urządzeniu oraz szybsze zamawianie — dane do wysyłki uzupełniają się automatycznie." },
  { q: "Jak mogę zapłacić?", a: "Udostępniamy BLIK, kartę płatniczą i Przelewy24 (płatność online). Zamówienie realizujemy po zaksięgowaniu wpłaty." },
  { q: "Czy wystawiacie fakturę?", a: "Tak, na życzenie. Zaznacz taką potrzebę w zamówieniu lub napisz do nas z danymi do faktury." },

  // Dostawa
  { q: "Jakie są sposoby dostawy?", a: "Wysyłamy przez InPost (Paczkomaty 24/7 i kurier), ORLEN Paczkę oraz kurierem. Punkt odbioru lub paczkomat wybierasz wygodnie na mapie podczas składania zamówienia." },
  { q: "Od jakiej kwoty jest darmowa dostawa?", a: "Dostawa jest darmowa przy zamówieniach od 150 zł. Poniżej tej kwoty koszt zależy od wybranej metody — najtańsza opcja to InPost Paczkomat." },
  { q: "Jak długo czekam na paczkę?", a: "Zwykle 1–2 dni robocze na przygotowanie i nadanie oraz 1–2 dni na doręczenie — łącznie najczęściej 2–4 dni robocze od zaksięgowania płatności." },
  { q: "Czy mogę śledzić zamówienie?", a: "Tak. Status sprawdzisz na stronie „Śledzenie zamówienia”, podając numer zamówienia i e-mail. Zalogowani klienci widzą historię w panelu konta." },

  // Zwroty i reklamacje
  { q: "Czy mogę zwrócić towar?", a: "Tak — masz 14 dni na zwrot bez podania przyczyny. Zasady i wzór formularza znajdziesz na stronie „Dostawa i zwroty”." },
  { q: "Jak zgłosić reklamację?", a: "Napisz do nas na adres e-mail podany w Kontakcie, opisując wadę i podając numer zamówienia. Odpowiemy w ciągu 14 dni." },

  // Produkty i materiały
  { q: "Z jakich materiałów są ubranka?", a: "Stawiamy na miękką, przewiewną bawełnę i dzianiny przyjazne skórze dziecka — bez uciskających szwów i z metkami, które nie drapią. To materiały wygodne na co dzień i łatwe w praniu." },
  { q: "Jak prać ubranka dziecięce?", a: "Zwykle w 30–40°C, delikatnym środkiem dla dzieci, susząc w cieniu (dokładne zalecenia zawsze na metce). Nowe ubranka warto wyprać przed pierwszym założeniem. Więcej w poradniku na blogu." },
  { q: "Produkt jest niedostępny w moim rozmiarze — co zrobić?", a: "Na karcie produktu przy wyprzedanym rozmiarze możesz zostawić e-mail, a powiadomimy Cię, gdy wróci na stan. Nowe rozmiary i produkty dodajemy na bieżąco." },
  { q: "Kto może dodać opinię o produkcie?", a: "Opinie mogą dodawać wyłącznie klienci, którzy kupili dany produkt (weryfikujemy zakup po e-mailu z zamówienia). Dzięki temu oceny są prawdziwe i wiarygodne." },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PYTANIA.map((p) => ({
    "@type": "Question",
    name: p.q,
    acceptedAnswer: { "@type": "Answer", text: p.a },
  })),
};

export default function Faq() {
  return (
    <StronaInfo tytul="Najczęstsze pytania" wstep="Krótkie odpowiedzi na to, o co pytacie najczęściej.">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />
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
