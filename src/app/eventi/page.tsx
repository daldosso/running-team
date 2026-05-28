import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, races } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";
import { EventForm } from "./EventForm";
import { EventsList } from "./EventsList";

export const dynamic = "force-dynamic";

export default async function EventiPage() {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">Configura ORG_ID per vedere le info.</p>
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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Informazioni</h1>

      {canManage ? <EventForm races={raceList} className="mb-8" /> : null}

      <EventsList events={eventList} races={raceList} canManage={canManage} />
    </div>
  );
}
