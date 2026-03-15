"use server";

import { db } from "@/lib/db";
import { carSharing, races } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

export async function addCarSharing(
  raceId: string,
  memberId: string,
  role: "driver" | "passenger",
  seatsAvailable?: string,
  notes?: string
) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db.insert(carSharing).values({
    raceId,
    memberId,
    role,
    seatsAvailable: role === "driver" ? (seatsAvailable?.trim() || null) : null,
    notes: notes?.trim() || null,
  });
  revalidatePath("/gare");
  revalidatePath(`/gare/${raceId}`);
  return { ok: true };
}

export async function removeCarSharing(raceId: string, memberId: string) {
  await db
    .delete(carSharing)
    .where(
      and(eq(carSharing.raceId, raceId), eq(carSharing.memberId, memberId))
    );
  revalidatePath("/gare");
  revalidatePath(`/gare/${raceId}`);
  return { ok: true };
}
