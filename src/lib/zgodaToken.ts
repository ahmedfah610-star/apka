import { createHmac, timingSafeEqual } from "node:crypto";
import { BAZA } from "@/lib/mailSzablon";

// Podpisany link „wyłącz kody rabatowe i nowości" z maila — działa bez logowania,
// ale tylko dla konta, do którego został wysłany (nikt nie wyłączy zgody komuś innemu).
function sekret(): string {
  return process.env.NEWSLETTER_SECRET || process.env.RESEND_API_KEY || "bobas-zgoda-v1";
}

export function tokenZgody(userId: string): string {
  return createHmac("sha256", sekret()).update(`zgoda:${userId}`).digest("hex").slice(0, 32);
}

export function tokenZgodyOk(userId: string, token: string): boolean {
  const a = Buffer.from(tokenZgody(userId));
  const b = Buffer.from(String(token || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkWylaczeniaZgody(userId: string): string {
  return `${BAZA}/api/konto/zgoda?u=${encodeURIComponent(userId)}&t=${tokenZgody(userId)}`;
}
