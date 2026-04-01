import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members, payments } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { MemberForm } from "./MemberForm";
import { MembersList } from "./MembersList";
import { getTablePreferencesWithFallback } from "@/app/actions/table-preferences";
import { getMemberOptions } from "@/app/actions/member-options";

export const dynamic = "force-dynamic";

export default async function IscrittiPage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">
        Configura ORG_ID per vedere gli iscritti.
      </p>
    );
  }

  const [list, paymentsList] = await Promise.all([
    db
      .select()
      .from(members)
      .where(eq(members.organizationId, orgId))
      .orderBy(desc(members.createdAt)),
    db
      .select({
        memberId: payments.memberId,
        status: payments.status,
        amount: payments.amount,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.organizationId, orgId))
      .orderBy(desc(payments.paidAt), desc(payments.createdAt)),
  ]);

  const latestPaymentByMember = new Map<string, {
    status: string;
    amount: string;
    paidAt: Date | null;
    createdAt: Date;
  }>();

  for (const payment of paymentsList) {
    if (!payment.memberId) continue;
    if (!latestPaymentByMember.has(payment.memberId)) {
      latestPaymentByMember.set(payment.memberId, {
        status: payment.status,
        amount: payment.amount?.toString() ?? "0.00",
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      });
    }
  }

  const preferences = await getTablePreferencesWithFallback("iscritti");
  const memberOptions = await getMemberOptions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Iscritti</h1>
      <MemberForm
        memberOptions={memberOptions}
        className="mb-8"
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <MembersList
          members={list}
          latestPaymentByMember={latestPaymentByMember}
          memberOptions={memberOptions}
          initialColumnOrder={preferences?.columnOrder}
          initialColumnWidths={preferences?.columnWidths}
          initialSortColumn={preferences?.sortColumn ?? null}
          initialSortDirection={preferences?.sortDirection}
          initialSearchQuery={preferences?.searchQuery ?? ""}
        />
      </div>
    </div>
  );
}
