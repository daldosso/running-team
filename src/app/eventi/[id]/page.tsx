import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eventParticipants, events, members, races } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { AddEventParticipantForm } from "./AddEventParticipantForm";
import { EventParticipantsList } from "./EventParticipantsList";
import { FormattedEventText } from "../FormattedEventText";

export const dynamic = "force-dynamic";

export default async function EventoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const orgId = await getOrganizationId();
  if (!orgId) notFound();

  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));
  if (!event) notFound();

  const [race] = event.raceId
    ? await db.select().from(races).where(eq(races.id, event.raceId))
    : [null];

  const participants = await db
    .select({
      id: eventParticipants.id,
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      notes: eventParticipants.notes,
    })
    .from(eventParticipants)
    .innerJoin(members, eq(eventParticipants.memberId, members.id))
    .where(eq(eventParticipants.eventId, eventId));

  const allMembers = await db
    .select({ id: members.id, firstName: members.firstName, lastName: members.lastName })
    .from(members)
    .where(eq(members.organizationId, orgId));

  const already = new Set(participants.map((p) => p.memberId));
  const availableMembers = allMembers.filter((m) => !already.has(m.id));

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/eventi"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Torna agli eventi
        </Link>
      </div>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span>{formatDate(event.date)}</span>
          {event.time ? <span>ore {event.time}</span> : null}
          {event.location ? <span>· {event.location}</span> : null}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{event.title}</h1>
        {event.description ? (
          <FormattedEventText
            text={event.description}
            className="text-zinc-600 dark:text-zinc-400"
          />
        ) : null}
        {race ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Collegato a gara:{" "}
            <Link href={`/gare/${race.id}`} className="font-medium hover:underline">
              {race.name}
            </Link>
          </p>
        ) : null}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Partecipanti</h2>
      <AddEventParticipantForm
        eventId={eventId}
        availableMembers={availableMembers}
        className="mb-4"
      />
      <EventParticipantsList eventId={eventId} participants={participants} />
    </div>
  );
}
