// Dane rejestrowe sprzedawcy wymagane przepisami (GPSR, opakowania / ROP).
// Nowy numer (np. czeski) — dopisz kolejny wpis do REJESTRACJE_OPAKOWAN.

export const FIRMA = {
  nazwa: "AMIN.KIDS Sp. z o.o.",
  adres: "ul. Tomasza Zana 43/2.1, 20-601 Lublin, Polska",
  email: "amin.kids1@hotmail.com",
  telefon: "+48 793 878 222",
};

/** Rejestracja recyklingu opakowań (w Polsce: numer rejestrowy BDO z urzędu marszałkowskiego). */
export const REJESTRACJE_OPAKOWAN: { kraj: string; numer: string }[] = [{ kraj: "Polska", numer: "000744577" }];

export const OSWIADCZENIA_SPRZEDAJACEGO = [
  "Odpowiedzialność za wykonanie umowy sprzedaży i wysyłkę ponosi w całości sprzedający.",
  "Oferowane przez Sprzedającego produkty pozostają zgodne z mającymi zastosowanie przepisami prawa Unii Europejskiej, w szczególności z przepisami rozporządzenia 2023/988 w sprawie ogólnego bezpieczeństwa produktów.",
  "Sprzedawca oświadcza, że wszystkie oferowane produkty spełniają wymogi Rozporządzenia w sprawie opakowań i odpadów opakowaniowych oraz obowiązki w zakresie Rozszerzonej Odpowiedzialności Producenta.",
];

export const rejestracjeOpakowanTekst = () => REJESTRACJE_OPAKOWAN.map((r) => `${r.kraj} • ${r.numer}`).join(", ");
