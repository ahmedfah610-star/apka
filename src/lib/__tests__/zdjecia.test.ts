import { describe, expect, it } from "vitest";
import { zdjecie, zestawZdjec } from "@/lib/zdjecia";

const ALLEGRO = "https://a.allegroimg.com/original/11fb83/d4f423984a6bb76d006b20646165";
const SUPABASE = "https://wvqxnoqqkoptwyljywju.supabase.co/storage/v1/object/public/produkty/1794997849474-R-owa-sukienka-tiulowa-z-kokard-1-.png";

describe("zdjęcia w potrzebnym rozmiarze", () => {
  it("Allegro: mniejsza wersja z serwera Allegro", () => {
    expect(zdjecie(ALLEGRO, "s360")).toBe("https://a.allegroimg.com/s360/11fb83/d4f423984a6bb76d006b20646165");
    expect(zdjecie(ALLEGRO, "original")).toBe(ALLEGRO);
  });

  it("wgrane w panelu (Supabase, 2 MB PNG): przez optymalizator Vercela, szerokość z listy Next.js", () => {
    expect(zdjecie(SUPABASE, "s512")).toBe(`https://bobas-shopping.pl/_next/image?url=${encodeURIComponent(SUPABASE)}&w=640&q=75`);
    expect(zdjecie(SUPABASE, "s128")).toContain("&w=128&");
    expect(zdjecie(SUPABASE, "s360")).toContain("&w=384&");
    expect(zdjecie(SUPABASE, "original")).toBe(SUPABASE); // oryginał tylko tam, gdzie jawnie potrzebny
  });

  it("srcSet: Supabase z prawdziwymi szerokościami, inne adresy bez srcSet", () => {
    expect(zestawZdjec(SUPABASE, ["s360", "s720"])).toBe(`${zdjecie(SUPABASE, "s360")} 384w, ${zdjecie(SUPABASE, "s720")} 750w`);
    expect(zestawZdjec(ALLEGRO, ["s360"])).toBe("https://a.allegroimg.com/s360/11fb83/d4f423984a6bb76d006b20646165 360w");
    expect(zestawZdjec("/img/logo.png", ["s360"])).toBeUndefined();
    expect(zdjecie("/img/logo.png", "s360")).toBe("/img/logo.png");
  });
});
