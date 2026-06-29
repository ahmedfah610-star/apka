import type { Uslugodawca } from "@/types/domain";

// Przykładowe dane demo na etap 1 — nazwy, adresy i opinie są fikcyjne, służą do
// zaprezentowania mechanizmu rankingu. Realne dane (np. z Google Places + opinie
// użytkowników mojaŁapy) podłączymy w kolejnym etapie przez src/lib/providersService.ts.
export const USLUGODAWCY: Uslugodawca[] = [
  {
    id: "v1",
    typ: "weterynarz",
    nazwa: "Przychodnia VetCare",
    miasto: "Warszawa",
    adres: "ul. Mokotowska 12",
    telefon: "22 555 10 10",
    specjalizacje: ["chirurgia", "stomatologia", "dermatologia"],
    ocenaSrednia: 4.8,
    liczbaOpinii: 132,
    opinie: [
      { autor: "Kasia", ocena: 5, tresc: "Bardzo dokładne badanie, miły personel.", data: "2026-04-02" },
      { autor: "Marek", ocena: 5, tresc: "Szybka diagnoza, polecam.", data: "2026-03-20" },
    ],
  },
  {
    id: "v2",
    typ: "weterynarz",
    nazwa: "Gabinet Łapka i Pazurek",
    miasto: "Warszawa",
    adres: "ul. Puławska 88",
    telefon: "22 555 20 20",
    specjalizacje: ["kardiologia", "USG"],
    ocenaSrednia: 4.5,
    liczbaOpinii: 64,
    opinie: [
      { autor: "Ola", ocena: 4, tresc: "Dobry kontakt z pacjentem, trochę długo się czeka.", data: "2026-02-15" },
    ],
  },
  {
    id: "v3",
    typ: "weterynarz",
    nazwa: "VetMed Kraków",
    miasto: "Kraków",
    adres: "ul. Floriańska 5",
    telefon: "12 555 30 30",
    specjalizacje: ["chirurgia", "ortopedia"],
    ocenaSrednia: 4.9,
    liczbaOpinii: 201,
    opinie: [
      { autor: "Piotr", ocena: 5, tresc: "Uratowali mojego psa po wypadku, ogromny profesjonalizm.", data: "2026-01-10" },
    ],
  },
  {
    id: "v4",
    typ: "weterynarz",
    nazwa: "Centrum Weterynaryjne Wrocław",
    miasto: "Wrocław",
    adres: "ul. Świdnicka 40",
    telefon: "71 555 40 40",
    specjalizacje: ["dermatologia", "stomatologia"],
    ocenaSrednia: 4.3,
    liczbaOpinii: 47,
    opinie: [{ autor: "Anna", ocena: 4, tresc: "Solidnie, choć ceny wyższe niż gdzie indziej.", data: "2026-03-01" }],
  },
  {
    id: "g1",
    typ: "fryzjer",
    nazwa: "Salon Pies i Kot Styl",
    miasto: "Warszawa",
    adres: "ul. Marszałkowska 100",
    telefon: "22 555 50 50",
    specjalizacje: ["strzyżenie ras włochatych", "kąpiel"],
    ocenaSrednia: 4.9,
    liczbaOpinii: 88,
    opinie: [{ autor: "Magda", ocena: 5, tresc: "Mój pudel wyszedł jak z wystawy!", data: "2026-04-10" }],
  },
  {
    id: "g2",
    typ: "fryzjer",
    nazwa: "Groomers Studio",
    miasto: "Warszawa",
    adres: "ul. Grójecka 60",
    specjalizacje: ["trymowanie", "pielęgnacja pazurów"],
    ocenaSrednia: 4.4,
    liczbaOpinii: 35,
    opinie: [{ autor: "Tomek", ocena: 4, tresc: "Sprawnie i bez stresu dla psa.", data: "2026-02-28" }],
  },
  {
    id: "g3",
    typ: "fryzjer",
    nazwa: "Kocia Grzywka",
    miasto: "Kraków",
    adres: "ul. Karmelicka 22",
    specjalizacje: ["strzyżenie kotów", "rozczesywanie kłaków"],
    ocenaSrednia: 4.7,
    liczbaOpinii: 52,
    opinie: [{ autor: "Ewa", ocena: 5, tresc: "Jedyny salon, w którym kot się nie stresuje.", data: "2026-03-15" }],
  },
  {
    id: "g4",
    typ: "fryzjer",
    nazwa: "Pet Glamour Wrocław",
    miasto: "Wrocław",
    adres: "ul. Krupnicza 8",
    specjalizacje: ["strzyżenie wystawowe", "spa dla psów"],
    ocenaSrednia: 4.6,
    liczbaOpinii: 29,
    opinie: [{ autor: "Robert", ocena: 5, tresc: "Profesjonalne strzyżenie przed wystawą.", data: "2026-01-25" }],
  },
];

export function listaMiast(): string[] {
  return Array.from(new Set(USLUGODAWCY.map((u) => u.miasto))).sort();
}
