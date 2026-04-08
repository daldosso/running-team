import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, members, races, users } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { RacesList } from "./RacesList";
import { RaceForm } from "./RaceForm";

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

  const pastelTiles = [
    {
      container:
        "border-rose-300/40 bg-gradient-to-br from-rose-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-rose-300",
      badge: "border-rose-300/40 bg-rose-500/15 text-rose-100",
    },
    {
      container:
        "border-amber-300/40 bg-gradient-to-br from-amber-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-amber-300",
      badge: "border-amber-300/40 bg-amber-500/15 text-amber-100",
    },
    {
      container:
        "border-emerald-300/40 bg-gradient-to-br from-emerald-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-emerald-300",
      badge: "border-emerald-300/40 bg-emerald-500/15 text-emerald-100",
    },
    {
      container:
        "border-sky-300/40 bg-gradient-to-br from-sky-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-sky-300",
      badge: "border-sky-300/40 bg-sky-500/15 text-sky-100",
    },
    {
      container:
        "border-violet-300/40 bg-gradient-to-br from-violet-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-violet-300",
      badge: "border-violet-300/40 bg-violet-500/15 text-violet-100",
    },
    {
      container:
        "border-teal-300/40 bg-gradient-to-br from-teal-500/20 via-zinc-900/0 to-zinc-900/0 bg-zinc-900/80",
      bar: "bg-teal-300",
      badge: "border-teal-300/40 bg-teal-500/15 text-teal-100",
    },
  ];

  const tileClass = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % pastelTiles.length;
    }
    return pastelTiles[hash];
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
              <ul className="space-y-2 text-sm">
                {latestEvents.map((eventItem) => (
                  (() => {
                    const tile = tileClass(`${eventItem.title}-${eventItem.date}`);
                    return (
                  <li
                    key={eventItem.id}
                    className={`relative overflow-hidden rounded-lg border px-3 py-2 ${tile.container}`}
                  >
                    <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${tile.bar}`} />
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold leading-snug text-white">
                        {eventItem.title}
                      </div>
                      <div className="text-xs text-zinc-300">
                        {eventItem.date}
                        {eventItem.time ? ` · ${eventItem.time}` : ""}
                      </div>
                    </div>
                  </li>
                    );
                  })()
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Ultime gare</h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/gare"
                  className="inline-flex items-center rounded-full border border-sky-300/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 shadow-[0_8px_18px_rgba(14,116,144,0.25)] backdrop-blur transition hover:border-sky-300/70 hover:bg-sky-500/20 hover:text-white sm:text-sm"
                >
                  Tutte
                </Link>
                <Link
                  href="/gare#aggiungi-gara"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 text-sm font-semibold text-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition hover:border-emerald-300/70 hover:bg-emerald-500/20 hover:text-white"
                  aria-label="Aggiungi una gara"
                  title="Aggiungi una gara"
                >
                  +
                </Link>
              </div>
            </div>
            {latestRaces.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuna gara disponibile.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latestRaces.map((race) => (
                  (() => {
                    const tile = tileClass(`${race.name}-${race.location}`);
                    return (
                  <li
                    key={race.id}
                    className={`relative overflow-hidden rounded-lg border px-3 py-2 ${tile.container}`}
                  >
                    <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${tile.bar}`} />
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold leading-snug text-white">
                        {race.name}
                      </div>
                      <div className="text-xs text-zinc-300">
                        {race.raceDate} · {race.location}
                      </div>
                    </div>
                  </li>
                    );
                  })()
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
              <ul className="space-y-2 text-sm">
                {discountEvents.map((eventItem) => {
                  const code =
                    extractDiscountCode(eventItem.description) ||
                    extractDiscountCode(eventItem.title);
                  const tile = tileClass(`${eventItem.title}-${code ?? ""}`);
                  return (
                    <li
                      key={eventItem.id}
                      className={`relative overflow-hidden rounded-lg border px-3 py-2 ${tile.container}`}
                    >
                      <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${tile.bar}`} />
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold leading-snug text-white">
                          {eventItem.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                          <span>{eventItem.date}</span>
                          {code ? (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tile.badge}`}
                            >
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

      {isRunner || canManage ? (
        <div
          id="aggiungi-gara"
          className="flex flex-wrap items-center justify-between gap-3 scroll-mt-24"
        >
          <div>
            <h2 className="text-lg font-semibold">Aggiungi una gara</h2>
            <p className="text-sm text-zinc-500">
              Inserisci una gara e sarà visibile a tutta la squadra.
            </p>
          </div>
          <RaceForm />
        </div>
      ) : null}

      <RacesList races={list} canManage={canManage} />
    </div>
  );
}
