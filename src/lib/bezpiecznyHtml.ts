// Bezpieczny HTML opisów produktów (z Allegro i z edytora). Biała lista: każdy znacznik
// jest budowany od nowa — przechodzą tylko dozwolone znaczniki, bez atrybutów (poza src
// obrazka po https). Dzięki temu w opisie nie da się przemycić skryptu ani zdarzenia
// (onerror=…, javascript:, <svg onload>), niezależnie od cudzysłowów i zapisu.

const DOZWOLONE = new Set([
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "small", "sub", "sup", "span", "div", "section", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th", "img",
]);
const PUSTE = new Set(["br", "hr"]);
// Treść tych znaczników znika razem z nimi (nie jest tekstem dla klienta).
const NIEBEZPIECZNE_Z_TRESCIA = /<\s*(script|style|iframe|object|embed|noscript|template|svg|math|textarea|select|form|button|title|head)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;

export function bezpiecznyHtml(html: string | null | undefined): string {
  if (!html) return "";
  // Dozwolone znaczniki budujemy od nowa i odkładamy na bok; wszystko inne, co zostanie
  // z „<" i „>", staje się zwykłym tekstem (także urwany znacznik na końcu opisu).
  const znaczniki: string[] = [];
  const odloz = (t: string) => `\u0000${znaczniki.push(t) - 1}\u0000`;
  return String(html)
    .replace(/\u0000/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(NIEBEZPIECZNE_Z_TRESCIA, "")
    .replace(/<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_m, zamykajacy: string, znacznik: string, atrybuty: string) => {
      const t = znacznik.toLowerCase();
      if (!DOZWOLONE.has(t)) return "";
      if (zamykajacy) return PUSTE.has(t) ? "" : odloz(`</${t}>`);
      if (PUSTE.has(t)) return odloz(`<${t} />`);
      if (t === "img") {
        const m = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(atrybuty);
        const url = (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim();
        if (!/^https:\/\/[^\s"'<>`]+$/i.test(url)) return "";
        return odloz(`<img src="${url.replace(/&(?!amp;)/g, "&amp;")}" alt="" loading="lazy" />`);
      }
      return odloz(`<${t}>`);
    })
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => znaczniki[Number(i)] ?? "");
}
