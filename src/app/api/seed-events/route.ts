import { NextResponse } from "next/server";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

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

/**
 * Seed eventi sociali / divulgativi per la squadra.
 * Crea 5 eventi (se non esistono già) per l'organizzazione corrente.
 */
export async function POST() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata (imposta ORG_ID)" },
      { status: 400 }
    );
  }

  // Se esistono già eventi simili, evita duplicati (idempotente)
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(eq(events.organizationId, orgId), ilike(events.title, "%serata%"))
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({
      message: "Eventi già presenti (seed già eseguito).",
    });
  }

  const now = new Date();
  const nextFriday = nextWeekday(now, 5);
  const nextTuesday = nextWeekday(now, 2);
  const nextThursday = nextWeekday(now, 4);
  const nextSaturday = nextWeekday(now, 6);

  const seed = [
    {
      title: "Aperitivo della squadra",
      description:
        "Un momento per conoscerci meglio e organizzare le prossime gare. Consumazione libera.",
      date: toISODate(nextFriday),
      time: "19:30",
      location: "Centro (da definire)",
    },
    {
      title: "Gita sociale in montagna",
      description:
        "Escursione facile + pranzo. Porta scarpe da trail e abbigliamento a strati. Iscrizione entro 3 giorni prima.",
      date: toISODate(nextSaturday),
      time: "08:00",
      location: "Ritrovo parcheggio (da definire)",
    },
    {
      title: "Serata divulgativa con fisioterapista",
      description:
        "Prevenzione infortuni, stretching e recupero: domande e risposte + mini valutazioni (prenotazione).",
      date: toISODate(nextTuesday),
      time: "20:45",
      location: "Sala riunioni / online (da definire)",
    },
    {
      title: "Serata divulgativa con nutrizionista",
      description:
        "Alimentazione per la corsa: prima/durante/dopo, integrazione e esempi pratici. Porta le tue domande.",
      date: toISODate(nextThursday),
      time: "20:45",
      location: "Sala riunioni / online (da definire)",
    },
    {
      title: "Serata divulgativa con mental coach",
      description:
        "Gestione dell'ansia pre-gara, focus e motivazione: strumenti pratici per allenamento e gara.",
      date: toISODate(nextFriday),
      time: "20:45",
      location: "Sala riunioni / online (da definire)",
    },
  ] as const;

  const inserted = await db
    .insert(events)
    .values(
      seed.map((e) => ({
        organizationId: orgId,
        title: e.title,
        description: e.description,
        date: e.date,
        time: e.time,
        location: e.location,
        raceId: null,
      }))
    )
    .returning({ id: events.id, title: events.title, date: events.date });

  return NextResponse.json({
    message: "Eventi creati.",
    count: inserted.length,
    events: inserted,
  });
}

