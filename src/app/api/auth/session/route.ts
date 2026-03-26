import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const [org] = await db
    .select({ name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    orgId: session.orgId,
    role: session.role,
    orgName: org?.name ?? null,
    orgSlug: org?.slug ?? null,
  });
}

