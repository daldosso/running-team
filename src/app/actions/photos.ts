"use server";

import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

export async function deletePhoto(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .delete(photos)
    .where(and(eq(photos.id, id), eq(photos.organizationId, orgId)));
  revalidatePath("/foto");
  return { ok: true };
}
