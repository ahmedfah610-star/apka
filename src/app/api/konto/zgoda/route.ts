import { sbService } from "@/lib/supabase";
import { tokenZgodyOk } from "@/lib/zgodaToken";
import { stronaProsta } from "@/lib/stronaProsta";
import { M, BAZA, esc } from "@/lib/mailSzablon";

export const dynamic = "force-dynamic";

// „Wyłącz kody rabatowe i nowości" z linku w mailu — bez logowania, podpisany link.
// GET pokazuje potwierdzenie (skanery poczty otwierają linki same — nie mogą wyłączyć zgody
// za klienta), POST z przycisku faktycznie wyłącza zgodę.
function parametry(url: URL) {
  return { u: url.searchParams.get("u") ?? "", t: url.searchParams.get("t") ?? "" };
}
const zlyLink = () =>
  stronaProsta("Nieprawidłowy link", "Ten link jest nieprawidłowy. Zgodę możesz wyłączyć po zalogowaniu w zakładce „Moje konto” albo pisząc do nas.");

export async function GET(req: Request) {
  const { u, t } = parametry(new URL(req.url));
  if (!u || !tokenZgodyOk(u, t)) return zlyLink();
  const akcja = `${BAZA}/api/konto/zgoda?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`;
  return stronaProsta(
    "Wyłączyć kody rabatowe i nowości?",
    "Nie będziemy wysyłać Ci e-mailem kodów rabatowych ani nowości. Maile o Twoich zamówieniach dostaniesz jak zawsze.",
    `<form method="post" action="${esc(akcja)}" style="margin:0">
      <button type="submit" style="background:${M.ink};color:#fff;border:0;padding:13px 28px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer">TAK, WYŁĄCZ</button>
    </form>
    <a href="${BAZA}/produkty" style="display:inline-block;margin-top:14px;font-size:13px;color:${M.ink2}">Nie, zostaw</a>`,
  );
}

export async function POST(req: Request) {
  const { u, t } = parametry(new URL(req.url));
  if (!u || !tokenZgodyOk(u, t)) return zlyLink();
  const sb = sbService();
  if (!sb) return stronaProsta("Coś poszło nie tak", "Spróbuj ponownie za chwilę albo napisz do nas.");
  const { data } = await sb.auth.admin.getUserById(u);
  if (!data?.user) return zlyLink();
  const { error } = await sb.auth.admin.updateUserById(u, {
    user_metadata: { ...(data.user.user_metadata ?? {}), zgoda_marketing: false, zgoda_marketing_wycofana: new Date().toISOString() },
  });
  if (error) return stronaProsta("Coś poszło nie tak", "Spróbuj ponownie za chwilę albo napisz do nas.");
  return stronaProsta(
    "Gotowe — zgoda wyłączona",
    "Nie będziemy już wysyłać Ci kodów rabatowych ani nowości. Jeśli zmienisz zdanie, włączysz je w zakładce „Moje konto”.",
  );
}
