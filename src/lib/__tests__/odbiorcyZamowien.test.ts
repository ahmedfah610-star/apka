import { describe, expect, it } from "vitest";
import { odbiorcyZamowien } from "@/lib/mail";

describe("powiadomienie o nowym zamówieniu", () => {
  it("idzie na adres z MAIL_SKLEP i na skrzynkę firmy", () => {
    expect(odbiorcyZamowien("ahmedfah610@gmail.com")).toEqual(["ahmedfah610@gmail.com", "amin.kids1@hotmail.com"]);
  });
  it("bez duplikatów i pustych wpisów", () => {
    expect(odbiorcyZamowien(" Amin.Kids1@hotmail.com , ")).toEqual(["Amin.Kids1@hotmail.com"]);
    expect(odbiorcyZamowien(undefined)).toEqual(["amin.kids1@hotmail.com"]);
    expect(odbiorcyZamowien("a@x.pl,b@y.pl")).toEqual(["a@x.pl", "b@y.pl", "amin.kids1@hotmail.com"]);
  });
});
