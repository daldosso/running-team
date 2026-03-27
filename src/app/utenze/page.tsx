import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { asc, eq } from "drizzle-orm";

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
    })
    .from(users)
    .where(eq(users.organizationId, orgId))
    .orderBy(asc(users.email));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Utenze</h1>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
          Nessuna utenza trovata.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full table-fixed text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  {["Nome", "Email", "Ruolo", "Creata"].map((label) => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
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
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("it-IT")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
