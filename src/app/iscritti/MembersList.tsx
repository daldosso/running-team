"use client";

import { Fragment, useState } from "react";
import type { Member } from "@/lib/db/schema";
import { deleteMember, updateMember } from "@/app/actions/members";

export function MembersList({ members: list }: { members: Member[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

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
          {list.map((m) => {
            const isEditing = editingId === m.id;

            return (
              <Fragment key={m.id}>
                <tr
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
                    {!isEditing ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingId(m.id)}
                          className="text-zinc-700 hover:underline dark:text-zinc-200"
                        >
                          Modifica
                        </button>
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
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">In modifica</span>
                    )}
                  </td>
                </tr>
                {isEditing && (
                  <tr>
                    <td colSpan={4} className="border-b border-zinc-100 p-4">
                      <form
                        action={async (fd) => {
                          await updateMember(m.id, {
                            firstName: fd.get("firstName") as string,
                            lastName: fd.get("lastName") as string,
                            email: fd.get("email") as string,
                            phone: (fd.get("phone") as string) || undefined,
                            birthDate: (fd.get("birthDate") as string) || undefined,
                            notes: (fd.get("notes") as string) || undefined,
                          });
                          setEditingId(null);
                        }}
                        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Nome
                            </label>
                            <input
                              name="firstName"
                              required
                              defaultValue={m.firstName}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Cognome
                            </label>
                            <input
                              name="lastName"
                              required
                              defaultValue={m.lastName}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            Email
                          </label>
                          <input
                            name="email"
                            type="email"
                            required
                            defaultValue={m.email}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Telefono
                            </label>
                            <input
                              name="phone"
                              type="tel"
                              defaultValue={m.phone ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Data di nascita
                            </label>
                            <input
                              name="birthDate"
                              type="date"
                              defaultValue={m.birthDate ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            Note
                          </label>
                          <textarea
                            name="notes"
                            rows={2}
                            defaultValue={m.notes ?? ""}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="submit"
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                          >
                            Salva
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
                          >
                            Annulla
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
