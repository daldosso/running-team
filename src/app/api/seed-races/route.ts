import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, races } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { CALENDAR_RACES } from "@/lib/db/calendar-races";

export const dynamic = "force-dynamic";

export async function POST() {
  let orgId = await getOrganizationId();
  if (!orgId) {
    const [first] = await db.select().from(organizations).limit(1);
    if (first) orgId = first.id;
    else
      return NextResponse.json({ error: "Imposta ORG_ID o crea un'organizzazione (POST /api/seed)" }, { status: 400 });
  }

  const existing = await db.select({ id: races.id }).from(races).where(eq(races.organizationId, orgId));
  if (existing.length > 0) {
    return NextResponse.json({
      message: "Gare già presenti. Elimina le gare esistenti per ripopolare.",
      count: existing.length,
    });
  }

  await db.insert(races).values(
    CALENDAR_RACES.map((r) => ({
      organizationId: orgId,
      raceDate: r.date,
      type: r.type,
      name: r.name,
      location: r.location,
      province: r.province ?? null,
      distance: r.distance ?? null,
      time: r.time ?? null,
      infoUrl: r.infoUrl ? (r.infoUrl.startsWith("http") ? r.infoUrl : `https://${r.infoUrl}`) : null,
    }))
  );

  return NextResponse.json({
    message: "Calendario gare importato.",
    count: CALENDAR_RACES.length,
  });
}
