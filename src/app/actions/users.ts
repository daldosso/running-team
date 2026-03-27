"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

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
