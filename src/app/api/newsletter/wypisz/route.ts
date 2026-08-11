import { sbService } from "@/lib/supabase";
import { tokenOk } from "@/lib/newsletterToken";
import { M, BAZA } from "@/lib/mailSzablon";

export const dynamic = "force-dynamic";

function strona(tytul: string, tekst: string): Response {
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${tytul}</title></head>
<body style="margin:0;background:${M.tlo};font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${M.ink}">
  <div style="max-width:520px;margin:0 auto;padding:80px 24px;text-align:center">
    <div style="font-size:22px;font-weight:800;margin-bottom:22px"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${M.akcent};margin-right:8px"></span>bobas-shopping</div>
    <div style="background:#fff;border:1px solid ${M.linia};border-radius:18px;padding:36px 30px">
      <h1 style="font-size:22px;margin:0 0 10px">${tytul}</h1>
      <p style="font-size:15px;line-height:1.6;color:${M.ink2};margin:0 0 22px">${tekst}</p>
      <a href="${BAZA}/produkty" style="display:inline-block;background:${M.ink};color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-size:13px;font-weight:700">WRÓĆ DO SKLEPU</a>
    </div>
  </div>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = url.searchParams.get("t") ?? "";

  if (!email || !tokenOk(email, token)) {
    return strona("Nieprawidłowy link", "Ten link wypisu jest nieprawidłowy lub wygasł. Jeśli chcesz się wypisać, napisz do nas na kontakt.");
  }

  const sb = sbService();
  if (sb) {
    await sb.from("newsletter").delete().ilike("email", email);
  }
  return strona("Wypisano z newslettera", "Nie będziesz już otrzymywać naszych wiadomości. Szkoda, że odchodzisz — zawsze możesz zapisać się ponownie na stronie sklepu.");
}
