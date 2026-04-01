"use server";

import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { eq } from "drizzle-orm";

export async function getMemberOptions() {
  const orgId = await getOrganizationId();
  if (!orgId) return {
    statusOptions: [],
    genereOptions: [],
    materiale2026Options: [],
    spedizioneOptions: [],
    tagliaMagliaCotoneOptions: [],
    tagliaMagliaSolarOptions: [],
    tagliaMagliaPulsarOptions: [],
    tagliaCanottaSolarOptions: [],
    tagliaCanottaPulsarOptions: [],
    tagliaFelpaSolarOptions: [],
    tagliaFelpaPulsarOptions: [],
  };

  const membersList = await db
    .select({
      status: members.status,
      genere: members.genere,
      materiale2026Consegna: members.materiale2026Consegna,
      spedizione: members.spedizione,
      tagliaMagliaCotone: members.tagliaMagliaCotone,
      tagliaMagliaSolar: members.tagliaMagliaSolar,
      tagliaMagliaPulsar: members.tagliaMagliaPulsar,
      tagliaCanottaSolar: members.tagliaCanottaSolar,
      tagliaCanottaPulsar: members.tagliaCanottaPulsar,
      tagliaFelpaSolar: members.tagliaFelpaSolar,
      tagliaFelpaPulsar: members.tagliaFelpaPulsar,
    })
    .from(members)
    .where(eq(members.organizationId, orgId));

  const uniqueSet = (values: (string | null)[]): string[] =>
    Array.from(new Set(values.filter((v) => v && v.trim())))
      .map((v) => v as string)
      .filter((v) => v !== "0" && v !== "1")
      .sort();

  const defaultSizes = ["XS", "S", "M", "L", "XL"];
  const mergeDefaultSizes = (values: string[]) => {
    const normalized = values
      .map((v) => v.toUpperCase())
      .filter((v) => v && v.trim() && v !== "0" && v !== "1");

    const ordered = [
      ...defaultSizes,
      ...normalized.filter((v) => !defaultSizes.includes(v)),
    ];

    return Array.from(new Set(ordered));
  };

  return {
    statusOptions: uniqueSet(membersList.map((m) => m.status)),
    genereOptions: uniqueSet(membersList.map((m) => m.genere)),
    materiale2026Options: uniqueSet(membersList.map((m) => m.materiale2026Consegna)),
    spedizioneOptions: uniqueSet(membersList.map((m) => m.spedizione)),
    tagliaMagliaCotoneOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaMagliaCotone))),
    tagliaMagliaSolarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaMagliaSolar))),
    tagliaMagliaPulsarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaMagliaPulsar))),
    tagliaCanottaSolarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaCanottaSolar))),
    tagliaCanottaPulsarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaCanottaPulsar))),
    tagliaFelpaSolarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaFelpaSolar))),
    tagliaFelpaPulsarOptions: mergeDefaultSizes(uniqueSet(membersList.map((m) => m.tagliaFelpaPulsar))),
  };
}
