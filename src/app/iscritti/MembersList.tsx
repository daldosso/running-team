"use client";

import type { Member } from "@/lib/db/schema";
import { deleteMember } from "@/app/actions/members";

export function MembersList({ members: list }: { members: Member[] }) {
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessun iscritto. Aggiungi il primo con &quot;+ Nuovo iscritto&quot;.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Telefono</th>
            <th className="w-20 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr
              key={m.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3">
                {m.firstName} {m.lastName}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {m.email}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {m.phone ?? "—"}
              </td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    await deleteMember(m.id);
                  }}
                  onSubmit={(e) => {
                    if (!confirm("Eliminare questo iscritto?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Elimina
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
