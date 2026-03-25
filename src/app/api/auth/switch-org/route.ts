import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, users } from "@/lib/db/schema";
import { getSession, createSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { organizationId?: string }
    | null;
  const organizationId = body?.organizationId;
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId obbligatorio" },
      { status: 400 }
    );
  }

  const [membership] = await db
    .select({
      orgId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, session.userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    );

  if (!membership) {
    return NextResponse.json(
      { error: "Non hai accesso a questa organizzazione" },
      { status: 403 }
    );
  }

  // aggiorna sessione (tenant attivo)
  await createSessionCookie({
    userId: session.userId,
    orgId: membership.orgId,
    role: membership.role,
  });

  // aggiorna anche cookie legacy
  const cookieStore = await cookies();
  cookieStore.set("running-team-org-id", membership.orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // salva default org sul profilo utente (comodo per prossimo login)
  await db
    .update(users)
    .set({ organizationId: membership.orgId, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ ok: true });
}

