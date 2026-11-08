import { sbService } from "@/lib/supabase";
import { tokenOk } from "@/lib/newsletterToken";
import { stronaProsta } from "@/lib/stronaProsta";

export const dynamic = "force-dynamic";

const strona = (tytul: string, tekst: string) => stronaProsta(tytul, tekst);

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
