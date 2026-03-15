import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET: lista organizzazioni (per selezione tenant / setup).
 * POST: crea organizzazione (setup iniziale o signup company).
 */
export async function GET() {
  const rows = await db.select().from(organizations);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug } = body as { name: string; slug: string };
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "name e slug obbligatori" },
      { status: 400 }
    );
  }
  const [org] = await db
    .insert(organizations)
    .values({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
    })
    .returning();
  return NextResponse.json(org);
}
