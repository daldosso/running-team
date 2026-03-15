"use server";

import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export type MemberFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
};

export async function createMember(formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db.insert(members).values({
    organizationId: orgId,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim().toLowerCase(),
    phone: formData.phone?.trim() || null,
    birthDate: formData.birthDate || null,
    notes: formData.notes?.trim() || null,
  });
  revalidatePath("/");
  revalidatePath("/iscritti");
  return { ok: true };
}

export async function updateMember(id: string, formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .update(members)
    .set({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      birthDate: formData.birthDate || null,
      notes: formData.notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(and(eq(members.id, id), eq(members.organizationId, orgId)));
  revalidatePath("/");
  revalidatePath("/iscritti");
  return { ok: true };
}

export async function deleteMember(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId)));
  revalidatePath("/");
  revalidatePath("/iscritti");
  return { ok: true };
}
