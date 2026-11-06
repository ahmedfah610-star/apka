import { describe, expect, it } from "vitest";
import { polaczUstawienia, uporzadkujMetody, METODY_DOSTAWY } from "@/lib/dostawa";

// Zapis z panelu jak na produkcji: paczkomat ekonomiczny przemianowany na „Pocztex Kurier".
const ZAPIS = {
  darmowaOd: 150,
  metody: [
    { id: "inpost-paczkomat-eko", nazwa: "Pocztex Kurier", opis: "Kurier – dostawa do domu.", cena: 11.69, aktywna: true },
    { id: "inpost-paczkomat", cena: 14.6 },
    { id: "orlen-paczka", cena: 11.99 },
    { id: "dpd-punkt", cena: 11.5 },
    { id: "pocztex-punkt", cena: 7.26 },
    { id: "inpost-kurier", cena: 14.99 },
    { id: "kurier-dhl", cena: 19.99 },
  ],
};

describe("metody dostawy", () => {
  it("„Pocztex Kurier” to kurier pod adres, nie paczkomat InPost", () => {
    const u = polaczUstawienia(ZAPIS);
    const kurier = u.metody.find((m) => m.nazwa === "Pocztex Kurier")!;
    expect(kurier.id).toBe("pocztex-kurier");
    expect(kurier.paczkomat).toBeFalsy();
    expect(kurier.punkt).toBeFalsy();
    expect(kurier.cena).toBe(11.69);
    expect(kurier.info).toBeUndefined(); // bez opisu „wysyłki ekonomicznej do paczkomatu"
    expect(u.metody.find((m) => m.id === "inpost-paczkomat-eko")!.aktywna).toBe(false);
  });

  it("od najtańszej, InPost Paczkomat zawsze na drugim miejscu", () => {
    const widoczne = polaczUstawienia(ZAPIS).metody.filter((m) => m.aktywna !== false);
    expect(widoczne.map((m) => `${m.id} ${m.cena}`)).toEqual([
      "pocztex-punkt 7.26",
      "inpost-paczkomat 14.6",
      "dpd-punkt 11.5",
      "pocztex-kurier 11.69",
      "orlen-paczka 11.99",
      "inpost-kurier 14.99",
      "kurier-dhl 19.99",
    ]);
  });

  it("gdy InPost jest najtańszy — też ląduje na drugim miejscu", () => {
    const m = uporzadkujMetody(METODY_DOSTAWY.map((x) => ({ ...x, cena: x.id === "inpost-paczkomat" ? 1 : x.cena })));
    expect(m[1].id).toBe("inpost-paczkomat");
  });

  it("punkty odbioru mają swojego operatora mapy", () => {
    const u = polaczUstawienia(ZAPIS);
    expect(u.metody.filter((m) => m.punkt).map((m) => `${m.id}:${m.operator}`).sort()).toEqual(["dpd-punkt:DPD", "orlen-paczka:RUCH", "pocztex-punkt:POCZTA"]);
    expect(u.metody.filter((m) => m.paczkomat).map((m) => m.id).sort()).toEqual(["inpost-paczkomat", "inpost-paczkomat-eko"]);
  });
});
