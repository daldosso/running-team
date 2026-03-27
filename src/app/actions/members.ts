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

const normalizeInput = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (value === "$undefined") return undefined;
  if (typeof value !== "string") return String(value);
  return value;
};

const normalizeRequired = (value: unknown) => {
  const raw = normalizeInput(value);
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeOptional = (value: unknown) => {
  const raw = normalizeInput(value);
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function createMember(formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const firstName = normalizeRequired(formData.firstName);
  const lastName = normalizeRequired(formData.lastName);
  const emailRaw = normalizeRequired(formData.email);
  const email = emailRaw ? emailRaw.toLowerCase() : emailRaw;
  if (!firstName || !lastName || !email) {
    return { ok: false, error: "Nome, cognome ed email sono obbligatori" };
  }

  await db.insert(members).values({
    organizationId: orgId,
    firstName,
    lastName,
    email,
    phone: normalizeOptional(formData.phone) ?? null,
    birthDate: formData.birthDate || null,
    tessera: normalizeOptional(formData.tessera) ?? null,
    luogoNascita: normalizeOptional(formData.luogoNascita) ?? null,
    codiceFiscale: normalizeOptional(formData.codiceFiscale) ?? null,
    categoria: normalizeOptional(formData.categoria) ?? null,
    straniero: normalizeOptional(formData.straniero) ?? null,
    indirizzo: normalizeOptional(formData.indirizzo) ?? null,
    cap: normalizeOptional(formData.cap) ?? null,
    citta: normalizeOptional(formData.citta) ?? null,
    prov: normalizeOptional(formData.prov) ?? null,
    status: normalizeOptional(formData.status) ?? null,
    materiale2026Consegna: normalizeOptional(formData.materiale2026Consegna) ?? null,
    spedizione: normalizeOptional(formData.spedizione) ?? null,
    genere: normalizeOptional(formData.genere) ?? null,
    tagliaMagliaCotone: normalizeOptional(formData.tagliaMagliaCotone) ?? null,
    tagliaMagliaSolar: normalizeOptional(formData.tagliaMagliaSolar) ?? null,
    tagliaMagliaPulsar: normalizeOptional(formData.tagliaMagliaPulsar) ?? null,
    tagliaCanottaSolar: normalizeOptional(formData.tagliaCanottaSolar) ?? null,
    tagliaCanottaPulsar: normalizeOptional(formData.tagliaCanottaPulsar) ?? null,
    tagliaFelpaSolar: normalizeOptional(formData.tagliaFelpaSolar) ?? null,
    tagliaFelpaPulsar: normalizeOptional(formData.tagliaFelpaPulsar) ?? null,
    notes: normalizeOptional(formData.notes) ?? null,
  });
  revalidatePath("/");
  revalidatePath("/iscritti");
  return { ok: true };
}

export async function updateMember(id: string, formData: MemberFormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { ok: false, error: "Organizzazione non specificata" };

  const [current] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, id), eq(members.organizationId, orgId)));
  if (!current) return { ok: false, error: "Iscritto non trovato" };

  const nextFirstName = normalizeRequired(formData.firstName);
  const nextLastName = normalizeRequired(formData.lastName);
  const nextEmailRaw = normalizeRequired(formData.email);
  const nextEmail = nextEmailRaw ? nextEmailRaw.toLowerCase() : nextEmailRaw;

  if (nextFirstName === null || nextLastName === null || nextEmail === null) {
    return { ok: false, error: "Nome, cognome ed email sono obbligatori" };
  }

  await db
    .update(members)
    .set({
      firstName: nextFirstName ?? current.firstName,
      lastName: nextLastName ?? current.lastName,
      email: nextEmail ?? current.email,
      phone: normalizeOptional(formData.phone) ?? current.phone,
      birthDate: formData.birthDate ?? current.birthDate,
      tessera: normalizeOptional(formData.tessera) ?? current.tessera,
      luogoNascita: normalizeOptional(formData.luogoNascita) ?? current.luogoNascita,
      codiceFiscale: normalizeOptional(formData.codiceFiscale) ?? current.codiceFiscale,
      categoria: normalizeOptional(formData.categoria) ?? current.categoria,
      straniero: normalizeOptional(formData.straniero) ?? current.straniero,
      indirizzo: normalizeOptional(formData.indirizzo) ?? current.indirizzo,
      cap: normalizeOptional(formData.cap) ?? current.cap,
      citta: normalizeOptional(formData.citta) ?? current.citta,
      prov: normalizeOptional(formData.prov) ?? current.prov,
      status: normalizeOptional(formData.status) ?? current.status,
      materiale2026Consegna:
        normalizeOptional(formData.materiale2026Consegna) ??
        current.materiale2026Consegna,
      spedizione: normalizeOptional(formData.spedizione) ?? current.spedizione,
      genere: normalizeOptional(formData.genere) ?? current.genere,
      tagliaMagliaCotone:
        normalizeOptional(formData.tagliaMagliaCotone) ?? current.tagliaMagliaCotone,
      tagliaMagliaSolar:
        normalizeOptional(formData.tagliaMagliaSolar) ?? current.tagliaMagliaSolar,
      tagliaMagliaPulsar:
        normalizeOptional(formData.tagliaMagliaPulsar) ?? current.tagliaMagliaPulsar,
      tagliaCanottaSolar:
        normalizeOptional(formData.tagliaCanottaSolar) ?? current.tagliaCanottaSolar,
      tagliaCanottaPulsar:
        normalizeOptional(formData.tagliaCanottaPulsar) ?? current.tagliaCanottaPulsar,
      tagliaFelpaSolar:
        normalizeOptional(formData.tagliaFelpaSolar) ?? current.tagliaFelpaSolar,
      tagliaFelpaPulsar:
        normalizeOptional(formData.tagliaFelpaPulsar) ?? current.tagliaFelpaPulsar,
      notes: normalizeOptional(formData.notes) ?? current.notes,
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
