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
  tessera?: string;
  luogoNascita?: string;
  codiceFiscale?: string;
  categoria?: string;
  straniero?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  prov?: string;
  status?: string;
  materiale2026Consegna?: string;
  spedizione?: string;
  genere?: string;
  tagliaMagliaCotone?: string;
  tagliaMagliaSolar?: string;
  tagliaMagliaPulsar?: string;
  tagliaCanottaSolar?: string;
  tagliaCanottaPulsar?: string;
  tagliaFelpaSolar?: string;
  tagliaFelpaPulsar?: string;
  notes?: string;
};

export async function createMember(formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const firstName = formData.firstName?.trim();
  const lastName = formData.lastName?.trim();
  const email = formData.email?.trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    return { ok: false, error: "Nome, cognome ed email sono obbligatori" };
  }

  await db.insert(members).values({
    organizationId: orgId,
    firstName,
    lastName,
    email,
    phone: formData.phone?.trim() || null,
    birthDate: formData.birthDate || null,
    tessera: formData.tessera?.trim() || null,
    luogoNascita: formData.luogoNascita?.trim() || null,
    codiceFiscale: formData.codiceFiscale?.trim() || null,
    categoria: formData.categoria?.trim() || null,
    straniero: formData.straniero?.trim() || null,
    indirizzo: formData.indirizzo?.trim() || null,
    cap: formData.cap?.trim() || null,
    citta: formData.citta?.trim() || null,
    prov: formData.prov?.trim() || null,
    status: formData.status?.trim() || null,
    materiale2026Consegna: formData.materiale2026Consegna?.trim() || null,
    spedizione: formData.spedizione?.trim() || null,
    genere: formData.genere?.trim() || null,
    tagliaMagliaCotone: formData.tagliaMagliaCotone?.trim() || null,
    tagliaMagliaSolar: formData.tagliaMagliaSolar?.trim() || null,
    tagliaMagliaPulsar: formData.tagliaMagliaPulsar?.trim() || null,
    tagliaCanottaSolar: formData.tagliaCanottaSolar?.trim() || null,
    tagliaCanottaPulsar: formData.tagliaCanottaPulsar?.trim() || null,
    tagliaFelpaSolar: formData.tagliaFelpaSolar?.trim() || null,
    tagliaFelpaPulsar: formData.tagliaFelpaPulsar?.trim() || null,
    notes: formData.notes?.trim() || null,
  });
  revalidatePath("/");
  revalidatePath("/iscritti");
  return { ok: true };
}

export async function updateMember(id: string, formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const firstName = formData.firstName?.trim();
  const lastName = formData.lastName?.trim();
  const email = formData.email?.trim().toLowerCase();
  if (!firstName || !lastName || !email) {
    return { ok: false, error: "Nome, cognome ed email sono obbligatori" };
  }

  await db
    .update(members)
    .set({
      firstName,
      lastName,
      email,
      phone: formData.phone?.trim() || null,
      birthDate: formData.birthDate || null,
      tessera: formData.tessera?.trim() || null,
      luogoNascita: formData.luogoNascita?.trim() || null,
      codiceFiscale: formData.codiceFiscale?.trim() || null,
      categoria: formData.categoria?.trim() || null,
      straniero: formData.straniero?.trim() || null,
      indirizzo: formData.indirizzo?.trim() || null,
      cap: formData.cap?.trim() || null,
      citta: formData.citta?.trim() || null,
      prov: formData.prov?.trim() || null,
      status: formData.status?.trim() || null,
      materiale2026Consegna: formData.materiale2026Consegna?.trim() || null,
      spedizione: formData.spedizione?.trim() || null,
      genere: formData.genere?.trim() || null,
      tagliaMagliaCotone: formData.tagliaMagliaCotone?.trim() || null,
      tagliaMagliaSolar: formData.tagliaMagliaSolar?.trim() || null,
      tagliaMagliaPulsar: formData.tagliaMagliaPulsar?.trim() || null,
      tagliaCanottaSolar: formData.tagliaCanottaSolar?.trim() || null,
      tagliaCanottaPulsar: formData.tagliaCanottaPulsar?.trim() || null,
      tagliaFelpaSolar: formData.tagliaFelpaSolar?.trim() || null,
      tagliaFelpaPulsar: formData.tagliaFelpaPulsar?.trim() || null,
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
