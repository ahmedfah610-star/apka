// Wspólny, markowy szablon e-maili (tabelaryczny HTML + style inline — zgodny
// z Gmail, Outlook, Apple Mail). Jeden spójny wygląd dla wszystkich wiadomości.

export const BAZA = (process.env.NEXT_PUBLIC_BAZOWY_URL || "https://bobas-shopping.pl").replace(/\/$/, "");

// Paleta marki (hex, bo klienty pocztowe nie wspierają oklch).
export const M = {
  tlo: "#F7F2EA",
  karta: "#FFFFFF",
  ink: "#2A2520",
  ink2: "#6E655B",
  ink3: "#9A9187",
  akcent: "#C2603D",
  akcentTlo: "#F7ECE6",
  linia: "#ECE5D9",
  zielony: "#3F8A5B",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bulletproof przycisk CTA. */
export function przycisk(tekst: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 6px"><tr>
    <td align="center" style="border-radius:12px;background:${M.ink}">
      <a href="${url}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:.05em;color:#ffffff;text-decoration:none;border-radius:12px">${esc(tekst)}</a>
    </td></tr></table>`;
}

interface OpcjePowloki {
  preheader?: string;       // ukryty podgląd w skrzynce
  emoji?: string;
  naglowek: string;
  intro?: string;           // akapit wstępny (może zawierać HTML)
  tresc?: string;           // dodatkowa treść HTML
  cta?: { tekst: string; url: string };
  marketing?: boolean;      // dodaje stopkę z wypisem
  unsubUrl?: string;
}

/** Owija treść w pełny, markowy dokument HTML e-maila. */
export function powloka(o: OpcjePowloki): string {
  const preheader = o.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>`
    : "";
  const cta = o.cta ? przycisk(o.cta.tekst, o.cta.url) : "";
  const intro = o.intro ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${M.ink2}">${o.intro}</p>` : "";
  const tresc = o.tresc || "";

  const stopkaMarketing = o.marketing
    ? `<p style="margin:10px 0 0;font-size:11.5px;line-height:1.6;color:${M.ink3}">
         Otrzymujesz tę wiadomość, bo zapisałeś/aś się do newslettera bobas-shopping.
         ${o.unsubUrl ? `<a href="${o.unsubUrl}" style="color:${M.ink2};text-decoration:underline">Wypisz się</a>` : ""}
       </p>`
    : "";

  return `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(o.naglowek)}</title></head>
<body style="margin:0;padding:0;background:${M.tlo};-webkit-font-smoothing:antialiased">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${M.tlo}">
  <tr><td align="center" style="padding:28px 14px 40px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">
      <!-- Nagłówek marki -->
      <tr><td align="center" style="padding:6px 0 22px">
        <a href="${BAZA}" style="text-decoration:none">
          <span style="font-family:${FONT};font-size:23px;font-weight:800;letter-spacing:-.02em;color:${M.ink}">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${M.akcent};margin-right:9px"></span>bobas-shopping
          </span>
        </a>
      </td></tr>
      <!-- Karta -->
      <tr><td style="background:${M.karta};border:1px solid ${M.linia};border-radius:18px;padding:36px 38px">
        <h1 style="margin:0 0 14px;font-family:${FONT};font-size:25px;line-height:1.2;font-weight:800;letter-spacing:-.02em;color:${M.ink}">
          ${o.emoji ? o.emoji + " " : ""}${esc(o.naglowek)}
        </h1>
        ${intro}
        ${tresc}
        ${cta}
      </td></tr>
      <!-- Stopka -->
      <tr><td style="padding:24px 26px;text-align:center;font-family:${FONT}">
        <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:${M.ink3}">
          AMIN.KIDS Sp. z o.o. · ul. Tomasza Zana 43/2.1, 20-601 Lublin<br>
          <a href="${BAZA}/produkty" style="color:${M.ink2};text-decoration:none">Sklep</a> &nbsp;·&nbsp;
          <a href="${BAZA}/blog" style="color:${M.ink2};text-decoration:none">Blog</a> &nbsp;·&nbsp;
          <a href="${BAZA}/kontakt" style="color:${M.ink2};text-decoration:none">Kontakt</a> &nbsp;·&nbsp;
          <a href="${BAZA}/regulamin" style="color:${M.ink2};text-decoration:none">Regulamin</a>
        </p>
        ${stopkaMarketing}
        <p style="margin:10px 0 0;font-size:11.5px;color:${M.ink3}">© ${new Date().getFullYear()} bobas-shopping · ubranka dla dzieci</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** Karta produktu do maili (2 w rzędzie). Zdjęcie, nazwa, cena, link. */
export function kartaProduktuMail(p: { nazwa: string; cena: number; zdjecie?: string | null; url: string }): string {
  const zl = `${p.cena.toFixed(2).replace(".", ",")} zł`;
  const img = p.zdjecie
    ? `<img src="${p.zdjecie}" alt="${esc(p.nazwa)}" width="252" style="display:block;width:100%;max-width:252px;height:190px;object-fit:contain;background:${M.tlo};border-radius:12px">`
    : `<div style="width:100%;height:190px;background:${M.tlo};border-radius:12px"></div>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td>
      <a href="${p.url}" style="text-decoration:none;color:${M.ink}">
        ${img}
        <div style="margin-top:10px;font-family:${FONT};font-size:14px;font-weight:600;line-height:1.35;color:${M.ink}">${esc(p.nazwa)}</div>
        <div style="margin-top:3px;font-family:${FONT};font-size:15px;font-weight:800;color:${M.ink}">${zl}</div>
      </a>
    </td></tr></table>`;
}
