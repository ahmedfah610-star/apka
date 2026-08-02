import { katalogWidoczny } from "@/lib/produktyDb";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ items: await katalogWidoczny() });
}
