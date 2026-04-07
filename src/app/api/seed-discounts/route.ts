import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, organizations } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgIdParam = searchParams.get("orgId")?.trim() || null;
  const all = searchParams.get("all") === "1";

  let orgIds: string[] = [];

  if (all) {
    const orgs = await db.select({ id: organizations.id }).from(organizations);
    orgIds = orgs.map((o) => o.id);
  } else {
    let orgId = orgIdParam || (await getOrganizationId());
    if (!orgId) {
      const [existing] = await db.select().from(organizations).limit(1);
      if (existing) {
        orgId = existing.id;
      } else {
        const [created] = await db
          .insert(organizations)
          .values({ name: "Squadra Demo", slug: "squadra-demo" })
          .returning();
        orgId = created!.id;
      }
    }
    orgIds = [orgId];
  }

  const today = new Date();
  const in7 = new Date(today);
  in7.setDate(today.getDate() + 7);
  const in14 = new Date(today);
  in14.setDate(today.getDate() + 14);
  const in21 = new Date(today);
  in21.setDate(today.getDate() + 21);

  const discountEvents = [
    {
      title: "Sconto 20% Sportway",
      description:
        "Sconto 20% su tutti gli articoli sportivi allo Sportway. Codice: SPORTWAY20",
      date: toISODate(in7),
      time: "00:00",
      location: "Sportway (negozio)",
    },
    {
      title: "Sconto 10% Milano City Marathon",
      description:
        "Sconto 10% sull'iscrizione alla Milano City Marathon. Codice: MILANO10",
      date: toISODate(in14),
      time: "00:00",
      location: "Online",
    },
    {
      title: "Sconto 15% Scarpe da running",
      description:
        "Sconto 15% su scarpe da running selezionate. Codice: RUN15",
      date: toISODate(in21),
      time: "00:00",
      location: "Running Store (negozio)",
    },
  ];

  const titles = discountEvents.map((e) => e.title);
  let insertedTotal = 0;

  for (const orgId of orgIds) {
    const existing = await db
      .select({ title: events.title })
      .from(events)
      .where(and(eq(events.organizationId, orgId), inArray(events.title, titles)));
    const existingTitles = new Set(existing.map((e) => e.title));

    const toInsert = discountEvents.filter((e) => !existingTitles.has(e.title));
    if (toInsert.length > 0) {
      await db.insert(events).values(
        toInsert.map((e) => ({
          organizationId: orgId,
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time,
          location: e.location,
          raceId: null,
        }))
      );
      insertedTotal += toInsert.length;
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: insertedTotal,
    organizations: orgIds.length,
  });
}
