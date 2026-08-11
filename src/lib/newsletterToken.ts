import { createHmac, timingSafeEqual } from "node:crypto";
import { BAZA } from "@/lib/mailSzablon";

// Podpisany token wypisu z newslettera (żeby nikt nie wypisał cudzego adresu).
function sekret(): string {
  return process.env.NEWSLETTER_SECRET || process.env.RESEND_API_KEY || "bobas-newsletter-v1";
}

export function tokenWypisu(email: string): string {
  return createHmac("sha256", sekret()).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function tokenOk(email: string, token: string): boolean {
  const a = Buffer.from(tokenWypisu(email));
  const b = Buffer.from(String(token || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkWypisu(email: string): string {
  const e = encodeURIComponent(email.trim().toLowerCase());
  return `${BAZA}/api/newsletter/wypisz?e=${e}&t=${tokenWypisu(email)}`;
}
