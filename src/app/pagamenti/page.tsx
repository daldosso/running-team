import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PaymentForm } from "./PaymentForm";
import { PaymentsList } from "./PaymentsList";

export const dynamic = "force-dynamic";

export default async function PagamentiPage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">
        Configura ORG_ID per vedere i pagamenti.
      </p>
    );
  }

  const [paymentsList, membersList] = await Promise.all([
    db
      .select()
      .from(payments)
      .where(eq(payments.organizationId, orgId))
      .orderBy(desc(payments.createdAt)),
    db
      .select({ id: members.id, firstName: members.firstName, lastName: members.lastName })
      .from(members)
      .where(eq(members.organizationId, orgId)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Pagamenti</h1>
      <PaymentForm members={membersList} className="mb-8" />
      <PaymentsList payments={paymentsList} members={membersList} />
    </div>
  );
}
