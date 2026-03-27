import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { races } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { RacesList } from "./RacesList";

export const dynamic = "force-dynamic";

export default async function GarePage() {
  const session = await getSession();
  const canManage = session?.role === "owner" || session?.role === "admin";
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gare</h1>
        <p className="text-sm text-zinc-500">
          Nessuna gara? Importa il calendario con{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">POST /api/seed-races</code>
        </p>
      </div>
      <RacesList races={list} canManage={canManage} />
    </div>
  );
}
