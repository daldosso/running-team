import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Crea un'organizzazione di esempio per sviluppo.
 * Chiama POST /api/seed per creare "Squadra Demo" e usa il suo id in ORG_ID.
 */
export async function POST() {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "squadra-demo"));
  if (existing.length > 0) {
    return NextResponse.json({
      message: "Organizzazione già presente. Usa ORG_ID in .env:",
      organizationId: existing[0].id,
    });
  }
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Squadra Demo",
      slug: "squadra-demo",
    })
    .returning();
  return NextResponse.json({
    message: "Organizzazione creata. Aggiungi in .env: ORG_ID=" + org!.id,
    organizationId: org!.id,
  });
}
