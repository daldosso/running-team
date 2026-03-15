import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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
    </div>
  );
}
