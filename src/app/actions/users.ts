"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function linkUserToMember(userId: string, memberId?: string | null) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .update(users)
    .set({ memberId: memberId || null, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)));

  revalidatePath("/utenze");
  return { ok: true };
}

export async function setUserPassword(userId: string, password: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "admin")) {
    return { ok: false, error: "Operazione non consentita" };
  }

  const nextPassword = password.trim();
  if (nextPassword.length < 8) {
    return { ok: false, error: "La password deve avere almeno 8 caratteri" };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
    .limit(1);
  if (!user) {
    return { ok: false, error: "Utente non trovato" };
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)));

  revalidatePath("/utenze");
  return { ok: true };
}

export async function deleteUser(userId: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "admin")) {
    return { ok: false, error: "Operazione non consentita" };
  }

  if (session.userId === userId) {
    return { ok: false, error: "Non puoi eliminare il tuo account corrente" };
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, orgId)))
    .limit(1);
  if (!user) {
    return { ok: false, error: "Utente non trovato" };
  }

  await db.delete(users).where(and(eq(users.id, userId), eq(users.organizationId, orgId)));
  revalidatePath("/utenze");
  return { ok: true };
}
