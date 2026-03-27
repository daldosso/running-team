"use server";

import { db } from "@/lib/db";
import { races, raceParticipants } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

export type RaceFormData = {
  raceDate: string;
  type: string;
  name: string;
  location: string;
  province?: string;
  distance?: string;
  time?: string;
  infoUrl?: string;
};

export async function createRace(formData: RaceFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const raceDate = formData.raceDate?.trim();
  const type = formData.type?.trim();
  const name = formData.name?.trim();
  const location = formData.location?.trim();
  if (!raceDate || !type || !name || !location) {
    return {
      ok: false,
      error: "Data, tipo, nome e località sono obbligatori",
    };
  }

  await db.insert(races).values({
    organizationId: orgId,
    raceDate,
    type,
    name,
    location,
    province: formData.province?.trim() || null,
    distance: formData.distance?.trim() || null,
    time: formData.time?.trim() || null,
    infoUrl: formData.infoUrl?.trim() || null,
  });
  revalidatePath("/");
  revalidatePath("/gare");
  return { ok: true };
}

export async function deleteRace(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .delete(races)
    .where(and(eq(races.id, id), eq(races.organizationId, orgId)));
  revalidatePath("/");
  revalidatePath("/gare");
  return { ok: true };
}

export async function addParticipant(raceId: string, memberId: string, notes?: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db.insert(raceParticipants).values({
    raceId,
    memberId,
    notes: notes?.trim() || null,
  });
  revalidatePath("/gare");
  revalidatePath("/gare/[id]");
  return { ok: true };
}

export async function removeParticipant(raceId: string, memberId: string) {
  await db
    .delete(raceParticipants)
    .where(and(eq(raceParticipants.raceId, raceId), eq(raceParticipants.memberId, memberId)));
  revalidatePath("/gare");
  revalidatePath("/gare/[id]");
  return { ok: true };
}
