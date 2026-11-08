import { M, BAZA } from "@/lib/mailSzablon";

/** Prosta strona-komunikat w barwach sklepu (wypis z newslettera, wyłączenie zgody). `tresc` może zawierać HTML. */
export function stronaProsta(tytul: string, tresc: string, przycisk = `<a href="${BAZA}/produkty" style="display:inline-block;background:${M.ink};color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:13px;font-weight:700">WRÓĆ DO SKLEPU</a>`): Response {
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${tytul}</title></head>
<body style="margin:0;background:${M.tlo};font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${M.ink}">
  <div style="max-width:520px;margin:0 auto;padding:80px 24px;text-align:center">
    <div style="font-size:22px;font-weight:800;margin-bottom:22px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${M.akcent};margin-right:8px"></span>bobas-shopping</div>
    <div style="background:#fff;border:1px solid ${M.linia};border-radius:18px;padding:36px 30px">
      <h1 style="font-size:22px;margin:0 0 10px">${tytul}</h1>
      <p style="font-size:15px;line-height:1.6;color:${M.ink2};margin:0 0 22px">${tresc}</p>
      ${przycisk}
    </div>
  </div>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
