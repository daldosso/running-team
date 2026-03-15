import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  carSharing,
  organizations,
  raceParticipants,
  races,
} from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

const NOTE_AUTISTA = [
  "Partenza Gallarate 7:00",
  "Partenza da Busto 6:45",
  "Passo da Varese centro",
  "Ritrovo parcheggio stadio",
  "Partenza Saronno 7:30",
];

const NOTE_PASSEGGERO = [
  "Zona Gallarate",
  "Posso raggiungere Busto",
  "Vicino stazione",
  "",
  "",
];

/**
 * Inserisce car sharing random: per ogni gara con partecipanti,
 * assegna alcuni come autisti (con posti) e altri come passeggeri.
 * Esegui dopo seed-participants.
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

  const existingCarSharing = await db
    .select({ id: carSharing.id })
    .from(carSharing)
    .innerJoin(races, eq(carSharing.raceId, races.id))
    .where(eq(races.organizationId, orgId))
    .limit(1);

  if (existingCarSharing.length > 0) {
    return NextResponse.json({
      message: "Car sharing già popolato. Rimuovi le voci dalle pagine gare per ripopolare.",
    });
  }

  const raceIds = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.organizationId, orgId));

  let inserted = 0;

  for (const { id: raceId } of raceIds) {
    const participants = await db
      .select({ memberId: raceParticipants.memberId })
      .from(raceParticipants)
      .where(eq(raceParticipants.raceId, raceId));

    if (participants.length < 2) continue;

    const memberIds = participants.map((p) => p.memberId);
    const shuffled = [...memberIds].sort(() => Math.random() - 0.5);

    const numDrivers = Math.min(1 + Math.floor(Math.random() * 2), shuffled.length); // 1-2 autisti
    const drivers = shuffled.slice(0, numDrivers);
    const rest = shuffled.slice(numDrivers);
    const numPassengers = Math.min(1 + Math.floor(Math.random() * 3), rest.length); // 1-3 passeggeri
    const passengers = rest.slice(0, numPassengers);

    for (const memberId of drivers) {
      await db.insert(carSharing).values({
        raceId,
        memberId,
        role: "driver",
        seatsAvailable: String(1 + Math.floor(Math.random() * 3)), // 1-3 posti
        notes:
          NOTE_AUTISTA[Math.floor(Math.random() * NOTE_AUTISTA.length)] || null,
      });
      inserted++;
    }
    for (const memberId of passengers) {
      await db.insert(carSharing).values({
        raceId,
        memberId,
        role: "passenger",
        notes:
          NOTE_PASSEGGERO[Math.floor(Math.random() * NOTE_PASSEGGERO.length)] ||
          null,
      });
      inserted++;
    }
  }

  return NextResponse.json({
    message: "Car sharing popolato con dati random.",
    racesProcessed: raceIds.length,
    carSharingInserted: inserted,
  });
}
