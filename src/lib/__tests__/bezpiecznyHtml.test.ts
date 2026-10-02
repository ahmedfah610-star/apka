import { describe, expect, it } from "vitest";
import { bezpiecznyHtml } from "@/lib/bezpiecznyHtml";

describe("bezpiecznyHtml", () => {
  it("zostawia zwykły opis bez zmian", () => {
    const h = "<h2>Opis</h2><p>Body <b>bawełniane</b></p><ul><li>56 cm</li></ul>";
    expect(bezpiecznyHtml(h)).toBe(h);
  });
  it("usuwa skrypty i zdarzenia niezależnie od zapisu", () => {
    for (const zly of [
      "<img src=x onerror=alert(1)>",
      "<svg/onload=alert(1)>",
      "<script>alert(1)</script>",
      '<img src="javascript:alert(1)">',
      '<iframe src="https://zlo.pl"></iframe>',
      "<a href=\"javascript:alert(1)\">x</a>",
    ]) {
      const wynik = bezpiecznyHtml(zly);
      expect(wynik).not.toMatch(/<(script|svg|iframe|a)\b|on\w+=|javascript:/i);
    }
  });
  it("atrybuty znikają, obrazek https zostaje", () => {
    expect(bezpiecznyHtml('<p onclick="x()">t</p>')).toBe("<p>t</p>");
    expect(bezpiecznyHtml('<img src="https://a.allegroimg.com/x.jpg" onerror="x()">')).toBe(
      '<img src="https://a.allegroimg.com/x.jpg" alt="" loading="lazy" />',
    );
  });
  it("urwany znacznik staje się tekstem", () => {
    expect(bezpiecznyHtml("a < b <img src=x onerror=alert(1)")).toBe("a &lt; b &lt;img src=x onerror=alert(1)");
  });
});
