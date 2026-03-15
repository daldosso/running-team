import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, raceParticipants, races, members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

/**
 * Inserisce partecipanti random: per ogni gara (o un campione) assegna
 * 2-6 iscritti casuali. Utile dopo seed-data e seed-races.
 */
export async function POST() {
  let orgId = await getOrganizationId();
  if (!orgId) {
    const [first] = await db.select().from(organizations).limit(1);
    if (first) orgId = first.id;
    else
      return NextResponse.json(
        { error: "Imposta ORG_ID o crea un'organizzazione" },
        { status: 400 }
      );
  }

  const [memberList, raceList] = await Promise.all([
    db.select({ id: members.id }).from(members).where(eq(members.organizationId, orgId)),
    db.select({ id: races.id }).from(races).where(eq(races.organizationId, orgId)),
  ]);

  if (memberList.length === 0 || raceList.length === 0) {
    return NextResponse.json({
      error: "Servono sia iscritti che gare. Esegui prima POST /api/seed-data e POST /api/seed-races.",
    }, { status: 400 });
  }

  const existing = await db
    .select({ id: raceParticipants.id })
    .from(raceParticipants)
    .innerJoin(races, eq(raceParticipants.raceId, races.id))
    .where(eq(races.organizationId, orgId));
  if (existing.length > 0) {
    return NextResponse.json({
      message: "Partecipanti già presenti. Elimina le partecipazioni dalle pagine gare per ripopolare.",
      count: existing.length,
    });
  }

  let inserted = 0;
  const memberIds = memberList.map((m) => m.id);
  const raceIds = raceList.map((r) => r.id);

  for (const race of raceIds) {
    const numParticipants = Math.min(2 + Math.floor(Math.random() * 5), memberIds.length); // 2-6 per gara
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, numParticipants);
    for (const memberId of chosen) {
      await db.insert(raceParticipants).values({
        raceId: race,
        memberId,
      });
      inserted++;
    }
  }

  return NextResponse.json({
    message: "Partecipanti random inseriti.",
    racesCount: raceIds.length,
    participantsInserted: inserted,
  });
}
