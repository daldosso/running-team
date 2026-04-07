import { db } from "@/lib/db";
import { members, users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { asc, eq } from "drizzle-orm";
import { linkUserToMember } from "@/app/actions/users";
import NewUserForm from "@/app/utenze/NewUserForm";

export const dynamic = "force-dynamic";

export default async function UtenzePage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">
        Configura ORG_ID per vedere le utenze.
      </p>
    );
  }

  const list = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      memberId: users.memberId,
    })
    .from(users)
    .where(eq(users.organizationId, orgId))
    .orderBy(asc(users.email));

  const membersList = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
    })
    .from(members)
    .where(eq(members.organizationId, orgId))
    .orderBy(asc(members.lastName));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Users</h1>
      <NewUserForm />
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
          Nessuna utenza trovata.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full table-fixed text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  {["Nome", "Email", "Ruolo", "Iscritto", "Creata"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((u) => {
                  const linkAction = async (fd: FormData) => {
                    "use server";
                    const memberId = (fd.get("memberId") as string) || null;
                    await linkUserToMember(u.id, memberId);
                  };
                  return (
                  <tr
                    key={u.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {u.role}
                    </td>
                    <td className="px-4 py-3">
                      <form action={linkAction} className="flex items-center gap-2">
                        <select
                          name="memberId"
                          defaultValue={u.memberId ?? ""}
                          className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        >
                          <option value="">—</option>
                          {membersList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Salva
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("it-IT")
                        : "—"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
