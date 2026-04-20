"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eventParticipants, events } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export type EventFormData = {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  location?: string;
  raceId?: string;
};

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function createEvent(formData: EventFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const title = formData.title?.trim();
  const date = formData.date?.trim();
  if (!title || !date) {
    return { ok: false, error: "Titolo e data sono obbligatori" };
  }

  const [row] = await db
    .insert(events)
    .values({
      organizationId: orgId,
      title,
      description: normalizeOptional(formData.description),
      date,
      time: normalizeOptional(formData.time),
      location: normalizeOptional(formData.location),
      raceId: normalizeOptional(formData.raceId),
    })
    .returning({ id: events.id });

  revalidatePath("/eventi");
  return { ok: true, id: row?.id };
}

export async function updateEvent(eventId: string, formData: EventFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const title = formData.title?.trim();
  const date = formData.date?.trim();
  if (!title || !date) {
    return { ok: false, error: "Titolo e data sono obbligatori" };
  }

  const [eventRow] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));
  if (!eventRow) return { ok: false, error: "Evento non trovato" };

  await db
    .update(events)
    .set({
      title,
      description: normalizeOptional(formData.description),
      date,
      time: normalizeOptional(formData.time),
      location: normalizeOptional(formData.location),
      raceId: normalizeOptional(formData.raceId),
    })
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${eventId}`);
  return { ok: true };
}

export async function deleteEvent(eventId: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));
  revalidatePath("/eventi");
  return { ok: true };
}

export async function addEventParticipant(
  eventId: string,
  memberId: string,
  notes?: string
) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const [eventRow] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));
  if (!eventRow) return { ok: false, error: "Evento non trovato" };

  await db.insert(eventParticipants).values({
    eventId,
    memberId,
    notes: notes?.trim() || null,
  });

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${eventId}`);
  return { ok: true };
}

export async function removeEventParticipant(eventId: string, memberId: string) {
  await db
    .delete(eventParticipants)
    .where(
      and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.memberId, memberId)
      )
    );

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${eventId}`);
  return { ok: true };
}
