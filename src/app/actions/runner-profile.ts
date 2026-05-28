"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { members, users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export type RunnerProfileFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  luogoNascita?: string;
  codiceFiscale?: string;
  tessera?: string;
  categoria?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  prov?: string;
  notes?: string;
};

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function saveRunnerProfile(formData: RunnerProfileFormData) {
  const session = await getSession();
  if (!session || session.role !== "runner") {
    return { ok: false, error: "Non autorizzato" };
  }

  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const firstName = formData.firstName.trim();
  const lastName = formData.lastName.trim();
  const email = formData.email.trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    return { ok: false, error: "Nome, cognome ed email sono obbligatori" };
  }

  const [user] = await db
    .select({ memberId: users.memberId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const values = {
    firstName,
    lastName,
    email,
    phone: normalizeOptional(formData.phone),
    birthDate: normalizeOptional(formData.birthDate),
    luogoNascita: normalizeOptional(formData.luogoNascita),
    codiceFiscale: normalizeOptional(formData.codiceFiscale),
    tessera: normalizeOptional(formData.tessera),
    categoria: normalizeOptional(formData.categoria),
    indirizzo: normalizeOptional(formData.indirizzo),
    cap: normalizeOptional(formData.cap),
    citta: normalizeOptional(formData.citta),
    prov: normalizeOptional(formData.prov),
    notes: normalizeOptional(formData.notes),
    updatedAt: new Date(),
  };

  if (user?.memberId) {
    await db
      .update(members)
      .set(values)
      .where(and(eq(members.id, user.memberId), eq(members.organizationId, orgId)));
  } else {
    const [member] = await db
      .insert(members)
      .values({
        organizationId: orgId,
        ...values,
      })
      .returning({ id: members.id });

    if (member?.id) {
      await db
        .update(users)
        .set({ memberId: member.id, updatedAt: new Date() })
        .where(eq(users.id, session.userId));
    }
  }

  revalidatePath("/pagamenti");
  revalidatePath("/");
  return { ok: true };
}
