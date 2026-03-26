import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Crea un'organizzazione di esempio per sviluppo.
 * Chiama `POST /api/seed` per creare "Squadra Demo" (o una org custom passando body `{ name, slug }`).
 *
 * Esempio:
 * - POST /api/seed
 * - POST /api/seed { "name": "Run Fast", "slug": "run-fast" }
 */
export async function POST(request: Request) {
  const raw = await request.text();

  let parsed: unknown = {};
  if (raw.trim().length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body for /api/seed",
          raw,
        },
        { status: 400 }
      );
    }
  }

  const body = parsed as Partial<{
    name: string;
    slug: string;
  }>;

  const name = body.name?.trim() || "Squadra Demo";
  const slug =
    body.slug?.trim().toLowerCase().replace(/\s+/g, "-") ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug));
  if (existing.length > 0) {
    return NextResponse.json({
      message: "Organizzazione già presente. Usa ORG_ID in .env:",
      organizationId: existing[0].id,
      name: existing[0].name,
      slug: existing[0].slug,
    });
  }
  const [org] = await db
    .insert(organizations)
    .values({
      name,
      slug,
    })
    .returning();
  return NextResponse.json({
    message: "Organizzazione creata. Aggiungi in .env: ORG_ID=" + org!.id,
    organizationId: org!.id,
    name: org!.name,
    slug: org!.slug,
  });
}
