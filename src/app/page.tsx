import { getSession } from "@/lib/auth";
import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session?.role === "runner") {
    redirect("/gare");
  }

  const orgId = await getOrganizationId();

  if (!orgId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
        <h2 className="mb-2 font-semibold text-amber-800 dark:text-amber-200">
          Organizzazione non configurata
        </h2>
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
          Imposta <code className="rounded bg-amber-200 px-1 dark:bg-amber-900">ORG_ID</code> in{" "}
          <code className="rounded bg-amber-200 px-1 dark:bg-amber-900">.env</code> oppure crea
          un&apos;organizzazione con POST /api/seed e usa l&apos;id restituito.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Per sviluppo: avvia il progetto, chiama <code>POST /api/seed</code> e copia{" "}
          <code>organizationId</code> in <code>.env</code> come <code>ORG_ID=...</code>.
        </p>
      </div>
    );
  }

  const [membersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.organizationId, orgId));
  const [paymentsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.organizationId, orgId));
  const [paidSum] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, orgId),
        eq(payments.status, "completed")
      )
    );

  const total = Number(paidSum?.total ?? 0);
  const countMembers = Number(membersCount?.count ?? 0);
  const countPayments = Number(paymentsCount?.count ?? 0);

  const monthsBack = 6;
  const monthFormatter = new Intl.DateTimeFormat("it-IT", { month: "short" });
  const monthKeys = Array.from({ length: monthsBack }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (monthsBack - 1 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: monthFormatter.format(date) };
  });
  const seriesStart = new Date();
  seriesStart.setDate(1);
  seriesStart.setMonth(seriesStart.getMonth() - (monthsBack - 1));

  const membersMonthly = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${members.createdAt}), 'YYYY-MM')`,
      count: sql<number>`count(*)`,
    })
    .from(members)
    .where(and(eq(members.organizationId, orgId), gte(members.createdAt, seriesStart)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const revenueMonthly = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${payments.createdAt}), 'YYYY-MM')`,
      total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, orgId),
        eq(payments.status, "completed"),
        gte(payments.createdAt, seriesStart)
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const paymentsByStatus = await db
    .select({
      status: payments.status,
      count: sql<number>`count(*)`,
    })
    .from(payments)
    .where(eq(payments.organizationId, orgId))
    .groupBy(payments.status);

  const membersSeries = monthKeys.map(({ key }) => {
    const match = membersMonthly.find((row) => row.month === key);
    return match ? Number(match.count) : 0;
  });
  const revenueSeries = monthKeys.map(({ key }) => {
    const match = revenueMonthly.find((row) => row.month === key);
    return match ? Number(match.total) : 0;
  });
  const maxMembers = Math.max(1, ...membersSeries);
  const maxRevenue = Math.max(1, ...revenueSeries);
  const statusTotal = paymentsByStatus.reduce((acc, row) => acc + Number(row.count), 0);
  const statusEntries = paymentsByStatus.map((row) => ({
    status: row.status,
    count: Number(row.count),
    pct: statusTotal ? Math.round((Number(row.count) / statusTotal) * 100) : 0,
  }));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight">
        Dashboard
      </h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/iscritti"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Iscritti
          </p>
          <p className="mt-1 text-3xl font-bold">{countMembers}</p>
        </Link>
        <Link
          href="/pagamenti"
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Pagamenti
          </p>
          <p className="mt-1 text-3xl font-bold">{countPayments}</p>
        </Link>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Incassato
          </p>
          <p className="mt-1 text-3xl font-bold">
            € {total.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">Iscritti · ultimi 6 mesi</p>
              <p className="text-lg font-semibold">Andamento iscrizioni</p>
            </div>
            <div className="text-right text-sm text-zinc-500">
              Totale periodo
              <div className="text-lg font-semibold text-zinc-900">{membersSeries.reduce((a, b) => a + b, 0)}</div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex h-32 items-end gap-2">
              {membersSeries.map((value, index) => (
                <div key={monthKeys[index].key} className="flex-1">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-[color:var(--accent-strong)] to-[color:var(--accent)]"
                    style={{ height: `${Math.max(8, Math.round((value / maxMembers) * 100))}%` }}
                    title={`${value} iscritti`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-zinc-500">
              {monthKeys.map((month) => (
                <span key={month.key} className="w-full text-center">
                  {month.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Incassi · ultimi 6 mesi</p>
          <p className="mb-4 text-lg font-semibold">Totale incassi</p>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex h-32 items-end gap-2">
              {revenueSeries.map((value, index) => (
                <div key={monthKeys[index].key} className="flex-1">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-[color:var(--success)] to-[color:var(--accent)]"
                    style={{ height: `${Math.max(8, Math.round((value / maxRevenue) * 100))}%` }}
                    title={`€ ${value.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-zinc-500">
              {monthKeys.map((month) => (
                <span key={month.key} className="w-full text-center">
                  {month.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 text-sm text-zinc-500">
            Totale periodo:{" "}
            <span className="font-semibold text-zinc-900">
              € {revenueSeries.reduce((a, b) => a + b, 0).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Pagamenti · stato</p>
            <p className="text-lg font-semibold">Distribuzione pagamenti</p>
          </div>
          <div className="text-sm text-zinc-500">Totale: {statusTotal}</div>
        </div>
        <div className="space-y-3">
          {statusEntries.map((entry) => (
            <div key={entry.status} className="grid grid-cols-[120px_1fr_48px] items-center gap-3">
              <div className="text-sm font-medium text-zinc-600">{entry.status}</div>
              <div className="h-2 w-full rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[color:var(--accent-strong)] to-[color:var(--accent)]"
                  style={{ width: `${entry.pct}%` }}
                />
              </div>
              <div className="text-right text-sm text-zinc-500">{entry.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
