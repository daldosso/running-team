import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { OrgSwitcher } from "./OrgSwitcher";

export const dynamic = "force-dynamic";

export default async function OrganizzazioniPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(eq(organizationMembers.userId, session.userId));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Organizzazioni</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Seleziona l&apos;organizzazione (tenant) su cui lavorare.
      </p>
      <OrgSwitcher currentOrgId={session.orgId} organizations={rows} />
    </div>
  );
}

