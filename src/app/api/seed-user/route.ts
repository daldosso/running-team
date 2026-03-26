import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Crea un utente demo per sviluppo:
 * email: demo@running-team.it
 * password: Password123!
 * role: owner
 *
 * Se non esiste un'organizzazione, crea "Squadra Demo".
 */
export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const body = raw as Partial<{
    email: string;
    password: string;
    name: string;
    role: "owner" | "admin" | "runner";
    orgSlug: string;
    orgName: string;
  }> | null;

  const email = body?.email?.trim().toLowerCase() ?? "demo@running-team.it";
  const password = body?.password?.trim() ?? "Password123!";
  const name = body?.name?.trim() ?? "Demo Owner";
  const role =
    body?.role === "owner" || body?.role === "admin" || body?.role === "runner"
      ? body.role
      : "owner";
  const orgSlugRaw = body?.orgSlug?.trim() ?? "";
  const orgSlug = orgSlugRaw.length
    ? orgSlugRaw
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : "squadra-demo";
  const orgName = body?.orgName?.trim() ?? "Squadra Demo";

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  // Assicura l'organizzazione (slug) prima di creare membership/utente.
  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);
  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: orgName, slug: orgSlug })
      .returning();
  }

  // Se l'utente esiste, aggiungiamo solo la membership all'org indicata.
  if (existing.length > 0) {
    const userId = existing[0].id;
    const [existingMembership] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, userId)
        )
      )
      .limit(1);

    if (!existingMembership) {
      await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId,
        role,
      });
    } else {
      await db
        .update(organizationMembers)
        .set({ role })
        .where(
          and(
            eq(organizationMembers.organizationId, org.id),
            eq(organizationMembers.userId, userId)
          )
        );
    }

    await db
      .update(users)
      .set({ name, organizationId: org.id, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({
      message: "Utente esistente: membership aggiornata.",
      email,
      password,
      organizationId: org.id,
      role,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      name,
      organizationId: org.id,
      role,
    })
    .returning({ id: users.id });

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId: user!.id,
    role,
  });

  return NextResponse.json({
    message: "Utente creato.",
    email,
    password,
    organizationId: org.id,
    role,
  });
}

