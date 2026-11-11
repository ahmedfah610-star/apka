import { createHmac, timingSafeEqual } from "node:crypto";
import { BAZA } from "@/lib/mailSzablon";

// Podpisany link „Otwórz dokument" z maila z fakturą — działa bez logowania, tylko dla tego
// jednego dokumentu tego zamówienia (jak sam załącznik maila). Usunięty dokument → 404.
function sekret(): string {
  return process.env.NEWSLETTER_SECRET || process.env.RESEND_API_KEY || "bobas-dokument-v1";
}

export function tokenDokumentu(zamowienieId: string, dokumentId: string): string {
  return createHmac("sha256", sekret()).update(`dokument:${zamowienieId}:${dokumentId}`).digest("hex").slice(0, 32);
}

export function tokenDokumentuOk(zamowienieId: string, dokumentId: string, token: unknown): boolean {
  const a = Buffer.from(tokenDokumentu(zamowienieId, dokumentId));
  const b = Buffer.from(String(token ?? ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkDokumentuZMaila(zamowienieId: string, dokumentId: string): string {
  return `${BAZA}/api/dokument?z=${encodeURIComponent(zamowienieId)}&d=${encodeURIComponent(dokumentId)}&t=${tokenDokumentu(zamowienieId, dokumentId)}`;
}
