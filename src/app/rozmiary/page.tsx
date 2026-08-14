import type { Metadata } from "next";
import Link from "next/link";
import { StronaInfo, Sekcja } from "@/components/StronaInfo";
import { jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tabela rozmiarów dziecięcych — wzrost, wiek, jak mierzyć",
  description:
    "Tabela rozmiarów ubranek dla dzieci 0–14 lat: rozmiar, wzrost w cm i orientacyjny wiek. Dowiedz się, jak zmierzyć dziecko i dobrać rozmiar bez zwrotów.",
  alternates: { canonical: "/rozmiary" },
};

const WIERSZE: [string, string, string][] = [
  ["56", "do 56 cm", "noworodek"],
  ["62", "57–62 cm", "0–3 mies."],
  ["68", "63–68 cm", "3–6 mies."],
  ["74", "69–74 cm", "6–9 mies."],
  ["80", "75–80 cm", "9–12 mies."],
  ["86", "81–86 cm", "12–18 mies."],
  ["92", "87–92 cm", "1,5–2 lata"],
  ["98", "93–98 cm", "2–3 lata"],
  ["104", "99–104 cm", "3–4 lata"],
  ["110", "105–110 cm", "4–5 lat"],
  ["116", "111–116 cm", "5–6 lat"],
  ["122", "117–122 cm", "6–7 lat"],
  ["128", "123–128 cm", "7–8 lat"],
  ["134", "129–134 cm", "8–9 lat"],
  ["140", "135–140 cm", "9–10 lat"],
  ["146", "141–146 cm", "10–11 lat"],
  ["152", "147–152 cm", "11–12 lat"],
  ["158", "153–158 cm", "12–13 lat"],
  ["164", "159–164 cm", "13–14 lat"],
  ["170", "165–170 cm", "14–15 lat"],
];

const ld = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Jak dobrać rozmiar ubranka dla dziecka?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rozmiar ubranka dziecięcego odpowiada wzrostowi w centymetrach. Zmierz wzrost dziecka i wybierz rozmiar najbliższy tej wartości. Jeśli dziecko jest pomiędzy rozmiarami, wybierz większy.",
      },
    },
    {
      "@type": "Question",
      name: "Co oznacza rozmiar 92 lub 104?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rozmiar 92 to ubranko dla dziecka o wzroście około 92 cm, a 104 dla wzrostu około 104 cm. Rozmiar odpowiada wzrostowi w centymetrach, a nie wiekowi.",
      },
    },
  ],
};

export default function StronaRozmiarow() {
  return (
    <StronaInfo
      tytul="Tabela rozmiarów dziecięcych"
      wstep="Rozmiar ubranka odpowiada wzrostowi dziecka w centymetrach. Zmierz malucha, sprawdź tabelę i dobierz rozmiar bez zbędnych zwrotów."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(ld)} />

      <p>
        W Polsce i całej Europie obowiązuje jeden prosty system: <strong>rozmiar ubranka to wzrost dziecka w centymetrach</strong>.
        Rozmiar 92 oznacza ubranko dla dziecka o wzroście około 92 cm — a nie „na 2 lata”. Gdy raz to zrozumiesz, dobór rozmiaru
        przestaje być loterią.
      </p>

      <Sekcja tytul="Rozmiar, wzrost i wiek">
        <div className="overflow-x-auto rounded-xl border border-linia">
          <table className="w-full border-collapse text-[14.5px]">
            <thead>
              <tr className="bg-szary/50 text-left">
                <th className="px-4 py-3 font-semibold">Rozmiar</th>
                <th className="px-4 py-3 font-semibold">Wzrost dziecka</th>
                <th className="px-4 py-3 font-semibold">Orientacyjny wiek</th>
              </tr>
            </thead>
            <tbody>
              {WIERSZE.map(([r, w, wiek], i) => (
                <tr key={r} className={i % 2 ? "bg-white" : "bg-szary/20"}>
                  <td className="px-4 py-2.5 font-bold text-ink">{r}</td>
                  <td className="px-4 py-2.5 text-ink-2">{w}</td>
                  <td className="px-4 py-2.5 text-ink-2">{wiek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13.5px] text-ink-2">
          Przedziały wieku są orientacyjne — jeśli Twoje dziecko jest wyższe lub niższe od rówieśników, kieruj się wzrostem.
        </p>
      </Sekcja>

      <Sekcja tytul="Jak zmierzyć dziecko">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-ink-2">
          <li>Zmierz wzrost od czubka głowy do pięt — najlepiej, gdy dziecko stoi przy ścianie bez butów.</li>
          <li>Młodsze niemowlę zmierzysz na leżąco: zaznacz miejsce przy główce i przy stópkach, a potem zmierz odcinek.</li>
          <li>Zapisz też obwód klatki piersiowej i pasa — przydają się przy kurtkach, spodniach i body.</li>
          <li>Powtarzaj pomiar co 2–3 miesiące u maluchów; dzieci rosną skokowo.</li>
        </ul>
      </Sekcja>

      <Sekcja tytul="Gdy dziecko jest „pomiędzy” rozmiarami">
        <p>
          Wzrost 89 cm — brać 86 czy 92? Niemal zawsze wybieraj <strong>większy rozmiar</strong>. Ubranko posłuży dłużej, a dzieci
          rosną szybciej, niż zdążą je znosić. Przy dresach, piżamach i rzeczach „na luzie” lekki zapas jest wręcz wskazany.
        </p>
        <p>
          Wyjątkiem są rzeczy, które muszą dobrze leżeć: <strong>body niemowlęce</strong> (za duże podwija się pod pieluchą),
          rajstopy oraz kurtki zimowe. Tu celuj w rozmiar dokładnie na wzrost.
        </p>
      </Sekcja>

      <Sekcja tytul="Materiał ma znaczenie">
        <p>
          Dzianina i bawełna z domieszką elastanu wybaczają drobne różnice — rozciągają się i układają na sylwetce. Sztywniejsze
          tkaniny (jeans, len, tkane koszule) są mniej wyrozumiałe, więc przy nich trzymaj się tabeli ściślej.
        </p>
        <p>
          Masz wątpliwości? Napisz do nas przez <Link href="/kontakt" className="underline underline-offset-2 hover:text-akcent">formularz kontaktowy</Link> —
          pomożemy dobrać rozmiar. A gdyby coś nie pasowało, masz 14 dni na bezproblemowy zwrot.
        </p>
        <p className="pt-1">
          <Link href="/produkty" className="font-semibold text-ink underline underline-offset-2 hover:text-akcent">
            Przeglądaj ubranka dziecięce →
          </Link>
        </p>
      </Sekcja>
    </StronaInfo>
  );
}
