"use server";

import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { and, eq, isNotNull } from "drizzle-orm";

export async function getMemberOptions() {
  const orgId = await getOrganizationId();
  if (!orgId) return {
    statusOptions: [],
    genereOptions: [],
    materiale2026Options: [],
    spedizioneOptions: [],
  };

  const membersList = await db
    .select({
      status: members.status,
      genere: members.genere,
      materiale2026Consegna: members.materiale2026Consegna,
      spedizione: members.spedizione,
    })
    .from(members)
    .where(eq(members.organizationId, orgId));

  const uniqueSet = (values: (string | null)[]): string[] =>
    Array.from(new Set(values.filter((v) => v && v.trim())))
      .map(v => v as string)
      .sort();

  return {
    statusOptions: uniqueSet(membersList.map((m) => m.status)),
    genereOptions: uniqueSet(membersList.map((m) => m.genere)),
    materiale2026Options: uniqueSet(membersList.map((m) => m.materiale2026Consegna)),
    spedizioneOptions: uniqueSet(membersList.map((m) => m.spedizione)),
  };
}
