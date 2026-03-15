import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { carSharing, members, raceParticipants, races } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddParticipantForm } from "./AddParticipantForm";
import { ParticipantsList } from "./ParticipantsList";
import { CarSharingSection } from "./CarSharingSection";

export const dynamic = "force-dynamic";

export default async function GaraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raceId } = await params;
  const orgId = await getOrganizationId();
  if (!orgId) notFound();

  const [race] = await db
    .select()
    .from(races)
    .where(and(eq(races.id, raceId), eq(races.organizationId, orgId)));
  if (!race) notFound();

  const participants = await db
    .select({
      id: raceParticipants.id,
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      email: members.email,
      notes: raceParticipants.notes,
    })
    .from(raceParticipants)
    .innerJoin(members, eq(raceParticipants.memberId, members.id))
    .where(eq(raceParticipants.raceId, raceId));

  const allMembers = await db
    .select({ id: members.id, firstName: members.firstName, lastName: members.lastName })
    .from(members)
    .where(eq(members.organizationId, orgId));

  const alreadyParticipantIds = new Set(participants.map((p) => p.memberId));
  const availableMembers = allMembers.filter((m) => !alreadyParticipantIds.has(m.id));

  const carSharingList = await db
    .select({
      id: carSharing.id,
      memberId: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      role: carSharing.role,
      seatsAvailable: carSharing.seatsAvailable,
      notes: carSharing.notes,
    })
    .from(carSharing)
    .innerJoin(members, eq(carSharing.memberId, members.id))
    .where(eq(carSharing.raceId, raceId));

  const alreadyInCarSharing = new Set(carSharingList.map((c) => c.memberId));
  const participantsForCarSharing = participants.filter((p) => !alreadyInCarSharing.has(p.memberId));

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/gare"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Torna alle gare
        </Link>
      </div>
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {race.type}
          </span>
          <span className="text-zinc-500">{formatDate(race.raceDate)}</span>
          {race.time && (
            <span className="text-zinc-500">ore {race.time}</span>
          )}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{race.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {race.location}
          {race.province && ` (${race.province})`}
          {race.distance && ` · ${race.distance} km`}
        </p>
        {race.infoUrl && (
          <a
            href={race.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-teal-600 hover:underline dark:text-teal-400"
          >
            Sito / info →
          </a>
        )}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Chi partecipa</h2>
      <AddParticipantForm raceId={raceId} availableMembers={availableMembers} className="mb-4" />
      <ParticipantsList raceId={raceId} participants={participants} />

      <h2 className="mb-3 mt-10 text-lg font-semibold">Car sharing</h2>
      <CarSharingSection
        raceId={raceId}
        carSharingList={carSharingList}
        availableMembers={participantsForCarSharing}
      />
    </div>
  );
}
