// Przewoźnicy i szablony linków do śledzenia przesyłek.
// {NR} podstawiamy numerem listu przewozowego / paczki.

export interface Przewoznik {
  id: string;
  nazwa: string;
  sledzenie: string | null; // szablon URL z {NR}; null = brak publicznego trackingu
}

export const PRZEWOZNICY: Przewoznik[] = [
  { id: "inpost", nazwa: "InPost Paczkomat", sledzenie: "https://inpost.pl/sledzenie-przesylek?number={NR}" },
  { id: "inpost_kurier", nazwa: "InPost Kurier", sledzenie: "https://inpost.pl/sledzenie-przesylek?number={NR}" },
  { id: "orlen", nazwa: "ORLEN Paczka", sledzenie: "https://www.orlenpaczka.pl/sledz-przesylke/?number={NR}" },
  { id: "dpd", nazwa: "DPD", sledzenie: "https://tracktrace.dpd.com.pl/parcelDetails?p1={NR}" },
  { id: "dhl", nazwa: "DHL", sledzenie: "https://www.dhl.com/pl-pl/home/sledzenie.html?tracking-id={NR}" },
  { id: "pocztex", nazwa: "Poczta Polska / Pocztex", sledzenie: "https://emonitoring.poczta-polska.pl/?numer={NR}" },
  { id: "inny", nazwa: "Inny przewoźnik", sledzenie: null },
];

export function znajdzPrzewoznika(id?: string | null): Przewoznik | null {
  if (!id) return null;
  return PRZEWOZNICY.find((p) => p.id === id) ?? null;
}

/** Buduje URL do śledzenia dla danego przewoźnika i numeru (lub null). */
export function linkSledzenia(przewoznikId?: string | null, numer?: string | null): string | null {
  const p = znajdzPrzewoznika(przewoznikId);
  const nr = (numer ?? "").trim();
  if (!p || !p.sledzenie || !nr) return null;
  return p.sledzenie.replace("{NR}", encodeURIComponent(nr));
}
