import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, members, races, users } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { RacesList } from "./RacesList";

export const dynamic = "force-dynamic";

export default async function GarePage() {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
  const isRunner = session?.role === "runner";
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">Configura ORG_ID per vedere le gare.</p>
    );
  }

  const list = await db
    .select()
    .from(races)
    .where(eq(races.organizationId, orgId))
    .orderBy(desc(races.raceDate));

  let runnerWelcome: string | null = null;
  let runnerEmail: string | null = null;
  let latestEvents: typeof events.$inferSelect[] = [];
  let latestRaces: typeof races.$inferSelect[] = [];
  let discountEvents: typeof events.$inferSelect[] = [];

  if (isRunner && session?.userId) {
    const [userRow] = await db
      .select({
        name: users.name,
        email: users.email,
        firstName: members.firstName,
        lastName: members.lastName,
      })
      .from(users)
      .leftJoin(members, eq(users.memberId, members.id))
      .where(eq(users.id, session.userId))
      .limit(1);

    const displayName =
      userRow?.firstName && userRow?.lastName
        ? `${userRow.firstName} ${userRow.lastName}`
        : userRow?.name?.trim() || userRow?.email || "runner";
    runnerWelcome = displayName;
    runnerEmail = userRow?.email ?? null;

    [latestEvents, latestRaces, discountEvents] = await Promise.all([
      db
        .select()
        .from(events)
        .where(eq(events.organizationId, orgId))
        .orderBy(desc(events.date))
        .limit(5),
      db
        .select()
        .from(races)
        .where(eq(races.organizationId, orgId))
        .orderBy(desc(races.raceDate))
        .limit(5),
      db
        .select()
        .from(events)
        .where(
          and(
            eq(events.organizationId, orgId),
            or(
              ilike(events.title, "%sconto%"),
              ilike(events.description, "%sconto%"),
              ilike(events.description, "%codice%")
            )
          )
        )
        .orderBy(desc(events.date))
        .limit(5),
    ]);
  }

  const extractDiscountCode = (text: string | null) => {
    if (!text) return null;
    const match =
      text.match(/codice\s*[:\-]\s*([A-Z0-9_-]{4,})/i) ||
      text.match(/\b([A-Z0-9]{6,})\b/);
    return match ? match[1] : null;
  };

  return (
    <div className="space-y-6">
      {isRunner ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Benvenuto</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Ciao, {runnerWelcome}
              </h1>
              {runnerEmail ? (
                <p className="text-sm text-zinc-500 break-all">{runnerEmail}</p>
              ) : null}
            </div>
            <Link
              href="/eventi"
              className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Vai agli eventi
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Gare</h1>
          <p className="text-sm text-zinc-500">
            Nessuna gara? Importa il calendario con{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">POST /api/seed-races</code>
          </p>
        </div>
      )}

      {isRunner ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Ultimi eventi</h2>
              <Link href="/eventi" className="text-xs text-zinc-500 hover:text-zinc-700 sm:text-sm">
                Tutti
              </Link>
            </div>
            {latestEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessun evento disponibile.</p>
            ) : (
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {latestEvents.map((eventItem) => (
                  <li key={eventItem.id} className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium leading-snug">{eventItem.title}</div>
                      <div className="text-xs text-zinc-500">
                        {eventItem.date}
                        {eventItem.time ? ` · ${eventItem.time}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Ultime gare</h2>
              <Link href="/gare" className="text-xs text-zinc-500 hover:text-zinc-700 sm:text-sm">
                Tutte
              </Link>
            </div>
            {latestRaces.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuna gara disponibile.</p>
            ) : (
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {latestRaces.map((race) => (
                  <li key={race.id} className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium leading-snug">{race.name}</div>
                      <div className="text-xs text-zinc-500">
                        {race.raceDate} · {race.location}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Sconti attivi</h2>
              <Link href="/eventi" className="text-xs text-zinc-500 hover:text-zinc-700 sm:text-sm">
                Tutti
              </Link>
            </div>
            {discountEvents.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuno sconto disponibile.</p>
            ) : (
              <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                {discountEvents.map((eventItem) => {
                  const code =
                    extractDiscountCode(eventItem.description) ||
                    extractDiscountCode(eventItem.title);
                  return (
                    <li key={eventItem.id} className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium leading-snug">{eventItem.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span>{eventItem.date}</span>
                          {code ? (
                            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
                              {code}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <RacesList races={list} canManage={canManage} />
    </div>
  );
}
