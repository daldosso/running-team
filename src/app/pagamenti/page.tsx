import { getSession } from "@/lib/auth";
import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members, payments, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { PaymentForm } from "./PaymentForm";
import { PaymentsList } from "./PaymentsList";
import { RunnerProfileCard } from "./RunnerProfileCard";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function PagamentiPage() {
  const session = await getSession();
  if (!session) {
    return (
      <p className="text-zinc-500">
        Effettua il login per vedere i pagamenti.
      </p>
    );
  }

  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">
        Configura ORG_ID per vedere i pagamenti.
      </p>
    );
  }

  const canManage = session.role === "owner" || session.role === "admin";

  const [paymentsList, membersList, runnerProfile] = canManage
    ? await Promise.all([
        db
          .select()
          .from(payments)
          .where(eq(payments.organizationId, orgId))
          .orderBy(desc(payments.createdAt)),
        db
          .select({
            id: members.id,
            firstName: members.firstName,
            lastName: members.lastName,
          })
          .from(members)
          .where(eq(members.organizationId, orgId)),
        Promise.resolve(null),
      ])
    : await (async () => {
        // Per il runner mostriamo solo i pagamenti associati al suo "member"
        // (mapping semplice: match tra email utente e email member, oppure memberId se presente).
        const [user] = await db
          .select({ email: users.email, memberId: users.memberId })
          .from(users)
          .where(eq(users.id, session.userId))
          .limit(1);

        const userEmail = user?.email?.trim().toLowerCase() ?? null;
        const memberId = user?.memberId ?? null;

        const [member] = memberId
          ? await db
              .select({
                id: members.id,
                firstName: members.firstName,
                lastName: members.lastName,
                email: members.email,
                photoUrl: members.photoUrl,
              })
              .from(members)
              .where(and(eq(members.organizationId, orgId), eq(members.id, memberId)))
              .limit(1)
          : userEmail
            ? await db
                .select({
                  id: members.id,
                  firstName: members.firstName,
                  lastName: members.lastName,
                  email: members.email,
                  photoUrl: members.photoUrl,
                })
                .from(members)
                .where(and(eq(members.organizationId, orgId), eq(members.email, userEmail)))
                .limit(1)
            : [null];

        if (!member) {
          return [[], [], null];
        }

        const [paymentsForMember] = await Promise.all([
          db
            .select()
            .from(payments)
            .where(
              and(
                eq(payments.organizationId, orgId),
                eq(payments.memberId, member.id),
              )
            )
            .orderBy(desc(payments.createdAt)),
        ]);

        return [paymentsForMember, [member], member];
      })();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {canManage ? "Pagamenti" : "Profilo"}
      </h1>
      {canManage ? (
        <PaymentForm members={membersList} className="mb-8" />
      ) : null}
      {!canManage && runnerProfile ? (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Il mio profilo</h2>
          <RunnerProfileCard
            profile={{
              memberId: runnerProfile.id,
              firstName: runnerProfile.firstName,
              lastName: runnerProfile.lastName,
              email: runnerProfile.email,
              photoUrl: runnerProfile.photoUrl ?? null,
            }}
          />
          <div className="mt-6">
            <ChangePasswordForm />
          </div>
        </div>
      ) : null}
      <PaymentsList payments={paymentsList} members={membersList} canManage={canManage} />
    </div>
  );
}
