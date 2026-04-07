import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { organizationMembers, users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Role = "owner" | "admin" | "runner";

export async function POST(request: Request) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const canManage = session.role === "owner" || session.role === "admin";
  if (!canManage) {
    return NextResponse.json(
      { error: "Operazione non consentita" },
      { status: 403 }
    );
  }

  let payload: {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
  } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const email = payload?.email?.trim().toLowerCase() ?? "";
  const name = payload?.name?.trim() ?? null;
  const password = payload?.password?.trim() ?? "";
  const role: Role =
    payload?.role === "owner" || payload?.role === "admin" || payload?.role === "runner"
      ? payload.role
      : "runner";

  if (!email) {
    return NextResponse.json({ error: "Email obbligatoria" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: "Password obbligatoria" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await db
      .update(users)
      .set({
        name: name ?? existing.name,
        passwordHash,
        role,
        organizationId: orgId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));

    const [existingMembership] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, existing.id)
        )
      )
      .limit(1);

    if (!existingMembership) {
      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: existing.id,
        role,
      });
    } else {
      await db
        .update(organizationMembers)
        .set({ role })
        .where(
          and(
            eq(organizationMembers.organizationId, orgId),
            eq(organizationMembers.userId, existing.id)
          )
        );
    }

    return NextResponse.json({
      ok: true,
      userId: existing.id,
      email,
    });
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      organizationId: orgId,
      role,
    })
    .returning({ id: users.id });

  await db.insert(organizationMembers).values({
    organizationId: orgId,
    userId: user!.id,
    role,
  });

  return NextResponse.json({
    ok: true,
    userId: user!.id,
    email,
  });
}
