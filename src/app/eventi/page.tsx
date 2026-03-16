import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { events, races } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";

export const dynamic = "force-dynamic";

export default async function EventiPage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">Configura ORG_ID per vedere gli eventi.</p>
    );
  }

  const [eventList, raceList] = await Promise.all([
    db
      .select()
      .from(events)
      .where(eq(events.organizationId, orgId))
      .orderBy(desc(events.date)),
    db
      .select({ id: races.id, name: races.name, raceDate: races.raceDate })
      .from(races)
      .where(eq(races.organizationId, orgId))
      .orderBy(desc(races.raceDate)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Eventi</h1>

      <EventForm races={raceList} className="mb-8" />

      <EventsList events={eventList} races={raceList} />
    </div>
  );
}

