import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  carSharing,
  events,
  members,
  organizations,
  payments,
  photos,
  raceParticipants,
  races,
} from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { CALENDAR_RACES } from "@/lib/db/calendar-races";

export const dynamic = "force-dynamic";

const NOMI: string[] = [
  "Marco", "Luca", "Andrea", "Giuseppe", "Alessandro", "Francesco", "Matteo",
  "Giulia", "Chiara", "Elena", "Sara", "Martina", "Federica", "Laura", "Anna",
];

const COGNOMI: string[] = [
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo",
  "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini",
];

const DESCRIZIONI_PAGAMENTI: string[] = [
  "Quota iscrizione 2025",
  "Rinnovo annuale",
  "Quota sociale",
  "Iscrizione gara 10 km",
  "Iscrizione mezza maratona",
  "Tessera associativa",
  "Quota gennaio",
  "Rimborso maglietta",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(from: number, to: number): string {
  const start = new Date(from, 0, 1).getTime();
  const end = new Date(to, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().slice(0, 10);
}

function randomRecentDateWithinMonths(monthsBack: number): Date {
  const date = new Date();
  const monthOffset = Math.floor(Math.random() * monthsBack);
  date.setMonth(date.getMonth() - monthOffset);
  date.setDate(Math.floor(Math.random() * 27) + 1);
  date.setHours(Math.floor(Math.random() * 23), Math.floor(Math.random() * 59), 0, 0);
  return date;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function nextWeekday(from: Date, weekday: number) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (weekday + 7 - d.getDay()) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldReset = searchParams.get("reset") === "1";
  let orgId = await getOrganizationId();
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

  if (shouldReset) {
    const [existingMembers, existingRaces] = await Promise.all([
      db.select({ id: members.id }).from(members).where(eq(members.organizationId, orgId)),
      db.select({ id: races.id }).from(races).where(eq(races.organizationId, orgId)),
    ]);
    const raceIds = existingRaces.map((r) => r.id);

    if (raceIds.length > 0) {
      await db.delete(carSharing).where(eq(carSharing.raceId, raceIds[0]));
      await db.delete(raceParticipants).where(eq(raceParticipants.raceId, raceIds[0]));
      for (let i = 1; i < raceIds.length; i++) {
        await db.delete(carSharing).where(eq(carSharing.raceId, raceIds[i]));
        await db.delete(raceParticipants).where(eq(raceParticipants.raceId, raceIds[i]));
      }
    }

    await Promise.all([
      db.delete(photos).where(eq(photos.organizationId, orgId)),
      db.delete(events).where(eq(events.organizationId, orgId)),
      db.delete(races).where(eq(races.organizationId, orgId)),
      db.delete(payments).where(eq(payments.organizationId, orgId)),
      db.delete(members).where(eq(members.organizationId, orgId)),
    ]);
  }

  const existingMembers = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.organizationId, orgId));
  let memberIds = existingMembers.map((m) => m.id);
  let insertedMembersCount = 0;
  if (memberIds.length === 0) {
    const insertedMembers = await db
      .insert(members)
      .values(
        Array.from({ length: 18 }, (_, i) => {
          const nome = NOMI[i % NOMI.length];
          const cognome = COGNOMI[Math.floor(i / NOMI.length) % COGNOMI.length];
          const email = `${nome.toLowerCase()}.${cognome
            .toLowerCase()
            .replace(/\s/g, "")}${i}@email.it`;
          const createdAt = randomRecentDateWithinMonths(6);
          return {
            organizationId: orgId!,
            firstName: nome,
            lastName: cognome,
            email,
            phone: Math.random() > 0.2 ? `3${String(3000000000 + i * 123456).slice(0, 9)}` : null,
            birthDate: Math.random() > 0.3 ? randomDate(1970, 2005) : null,
            notes: Math.random() > 0.6 ? "Interesse mezza maratona" : null,
            createdAt,
            updatedAt: createdAt,
          };
        })
      )
      .returning({ id: members.id });
    memberIds = insertedMembers.map((r) => r.id);
    insertedMembersCount = insertedMembers.length;
  }

  const paymentsToInsert: Array<{
    organizationId: string;
    memberId: string;
    amount: string;
    currency: string;
    status: "pending" | "completed" | "failed" | "refunded";
    description: string;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  let insertedPaymentsCount = 0;
  if (memberIds.length > 0) {
    const existingPayments = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.organizationId, orgId));

    if (existingPayments.length === 0) {
      for (let i = 0; i < 15; i++) {
        const completed = i < 11;
        const failed = i === 12;
        const refunded = i === 13;
        const status = completed ? "completed" : failed ? "failed" : refunded ? "refunded" : "pending";
        const createdAt = randomRecentDateWithinMonths(6);
        paymentsToInsert.push({
          organizationId: orgId!,
          memberId: memberIds[i % memberIds.length]!,
          amount: (25 + Math.floor(Math.random() * 30)).toFixed(2),
          currency: "EUR",
          status,
          description: randomItem(DESCRIZIONI_PAGAMENTI),
          paidAt: completed ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        });
      }
      for (let i = 0; i < 5; i++) {
        const completed = Math.random() > 0.3;
        const createdAt = randomRecentDateWithinMonths(6);
        paymentsToInsert.push({
          organizationId: orgId!,
          memberId: memberIds[Math.floor(Math.random() * memberIds.length)]!,
          amount: (15 + Math.floor(Math.random() * 40)).toFixed(2),
          currency: "EUR",
          status: completed ? "completed" : "pending",
          description: randomItem(DESCRIZIONI_PAGAMENTI),
          paidAt: completed ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
        });
      }

      await db.insert(payments).values(
        paymentsToInsert.map((p) => ({
          organizationId: p.organizationId,
          memberId: p.memberId,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          description: p.description,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }))
      );
      insertedPaymentsCount = paymentsToInsert.length;
    }
  }

  const existingRaces = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.organizationId, orgId));
  if (existingRaces.length === 0) {
    await db.insert(races).values(
      CALENDAR_RACES.map((r) => ({
        organizationId: orgId!,
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
  }

  const existingEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.organizationId, orgId));
  if (existingEvents.length === 0) {
    const now = new Date();
    const nextFriday = nextWeekday(now, 5);
    const nextTuesday = nextWeekday(now, 2);
    const nextThursday = nextWeekday(now, 4);
    const nextSaturday = nextWeekday(now, 6);
    const seedEvents = [
      {
        title: "Aperitivo della squadra",
        description: "Un momento per conoscerci meglio e organizzare le prossime gare. Consumazione libera.",
        date: toISODate(nextFriday),
        time: "19:30",
        location: "Centro (da definire)",
      },
      {
        title: "Gita sociale in montagna",
        description: "Escursione facile + pranzo. Porta scarpe da trail e abbigliamento a strati.",
        date: toISODate(nextSaturday),
        time: "08:00",
        location: "Ritrovo parcheggio (da definire)",
      },
      {
        title: "Serata divulgativa con fisioterapista",
        description: "Prevenzione infortuni, stretching e recupero: domande e risposte + mini valutazioni.",
        date: toISODate(nextTuesday),
        time: "20:45",
        location: "Sala riunioni / online",
      },
      {
        title: "Serata divulgativa con nutrizionista",
        description: "Alimentazione per la corsa: prima/durante/dopo, integrazione e esempi pratici.",
        date: toISODate(nextThursday),
        time: "20:45",
        location: "Sala riunioni / online",
      },
      {
        title: "Serata divulgativa con mental coach",
        description: "Gestione dell'ansia pre-gara, focus e motivazione: strumenti pratici.",
        date: toISODate(nextFriday),
        time: "20:45",
        location: "Sala riunioni / online",
      },
    ];

    await db.insert(events).values(
      seedEvents.map((e) => ({
        organizationId: orgId!,
        title: e.title,
        description: e.description,
        date: e.date,
        time: e.time,
        location: e.location,
        raceId: null,
      }))
    );
  }

  const raceList = await db
    .select({ id: races.id })
    .from(races)
    .where(eq(races.organizationId, orgId));

  const existingParticipants = await db
    .select({ id: raceParticipants.id })
    .from(raceParticipants)
    .innerJoin(races, eq(raceParticipants.raceId, races.id))
    .where(eq(races.organizationId, orgId));

  let insertedParticipants = 0;
  if (existingParticipants.length === 0 && raceList.length > 0 && memberIds.length > 0) {
    for (const race of raceList) {
      const numParticipants = Math.min(2 + Math.floor(Math.random() * 5), memberIds.length);
      const shuffled = [...memberIds].sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, numParticipants);
      for (const memberId of chosen) {
        await db.insert(raceParticipants).values({
          raceId: race.id,
          memberId,
        });
        insertedParticipants++;
      }
    }
  }

  const existingCarSharing = await db
    .select({ id: carSharing.id })
    .from(carSharing)
    .innerJoin(races, eq(carSharing.raceId, races.id))
    .where(eq(races.organizationId, orgId))
    .limit(1);

  let insertedCarSharing = 0;
  if (existingCarSharing.length === 0 && raceList.length > 0) {
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

    for (const { id: raceId } of raceList) {
      const participants = await db
        .select({ memberId: raceParticipants.memberId })
        .from(raceParticipants)
        .where(eq(raceParticipants.raceId, raceId));

      if (participants.length < 2) continue;

      const ids = participants.map((p) => p.memberId);
      const shuffled = [...ids].sort(() => Math.random() - 0.5);

      const numDrivers = Math.min(1 + Math.floor(Math.random() * 2), shuffled.length);
      const drivers = shuffled.slice(0, numDrivers);
      const rest = shuffled.slice(numDrivers);
      const numPassengers = Math.min(1 + Math.floor(Math.random() * 3), rest.length);
      const passengers = rest.slice(0, numPassengers);

      for (const memberId of drivers) {
        await db.insert(carSharing).values({
          raceId,
          memberId,
          role: "driver",
          seatsAvailable: String(1 + Math.floor(Math.random() * 3)),
          notes: NOTE_AUTISTA[Math.floor(Math.random() * NOTE_AUTISTA.length)] || null,
        });
        insertedCarSharing++;
      }
      for (const memberId of passengers) {
        await db.insert(carSharing).values({
          raceId,
          memberId,
          role: "passenger",
          notes: NOTE_PASSEGGERO[Math.floor(Math.random() * NOTE_PASSEGGERO.length)] || null,
        });
        insertedCarSharing++;
      }
    }
  }

  const existingPhotos = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.organizationId, orgId));

  let insertedPhotos = 0;
  if (existingPhotos.length === 0 && memberIds.length > 0) {
    const photoRows = Array.from({ length: 8 }, (_, i) => ({
      organizationId: orgId!,
      raceId: raceList[i % raceList.length]?.id ?? null,
      memberId: memberIds[i % memberIds.length] ?? null,
      url: "/running-team-logo.png",
      filename: "running-team-logo.png",
      caption: `Allenamento ${i + 1}`,
      createdAt: randomRecentDateWithinMonths(6),
    }));
    await db.insert(photos).values(photoRows);
    insertedPhotos = photoRows.length;
  }

  return NextResponse.json({
    message: "Database popolato con dati reali di esempio.",
    membersInserted: insertedMembersCount,
    paymentsInserted: insertedPaymentsCount,
    racesInserted: existingRaces.length === 0 ? CALENDAR_RACES.length : 0,
    eventsInserted: existingEvents.length === 0 ? 5 : 0,
    participantsInserted: insertedParticipants,
    carSharingInserted: insertedCarSharing,
    photosInserted: insertedPhotos,
  });
}
