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
      <div className="overflow-x-auto">
        <table className="min-w-[2600px] w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 font-medium min-w-[220px]">Nome</th>
            <th className="px-4 py-3 font-medium min-w-[120px]">Tessera</th>
            <th className="px-4 py-3 font-medium min-w-[220px]">Codice Fiscale</th>
            <th className="px-4 py-3 font-medium">Cat.</th>
            <th className="px-4 py-3 font-medium min-w-[180px]">Status</th>
            <th className="px-4 py-3 font-medium min-w-[220px]">Materiale 2026</th>
            <th className="px-4 py-3 font-medium">Spedizione</th>
            <th className="px-4 py-3 font-medium">Genere</th>
            <th className="px-4 py-3 font-medium min-w-[260px]">Email</th>
            <th className="px-4 py-3 font-medium min-w-[160px]">Telefono</th>
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
                    {m.tessera ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.codiceFiscale ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.categoria ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.status ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.materiale2026Consegna ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.spedizione ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {m.genere ?? "—"}
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
                    <td colSpan={11} className="border-b border-zinc-100 p-4">
                      <form
                        action={async (fd) => {
                          await updateMember(m.id, {
                            firstName: fd.get("firstName") as string,
                            lastName: fd.get("lastName") as string,
                            email: fd.get("email") as string,
                            phone: (fd.get("phone") as string) || undefined,
                            birthDate: (fd.get("birthDate") as string) || undefined,
                            tessera: (fd.get("tessera") as string) || undefined,
                            luogoNascita: (fd.get("luogoNascita") as string) || undefined,
                            codiceFiscale: (fd.get("codiceFiscale") as string) || undefined,
                            categoria: (fd.get("categoria") as string) || undefined,
                            straniero: (fd.get("straniero") as string) || undefined,
                            indirizzo: (fd.get("indirizzo") as string) || undefined,
                            cap: (fd.get("cap") as string) || undefined,
                            citta: (fd.get("citta") as string) || undefined,
                            prov: (fd.get("prov") as string) || undefined,
                            status: (fd.get("status") as string) || undefined,
                            materiale2026Consegna:
                              (fd.get("materiale2026Consegna") as string) || undefined,
                            spedizione: (fd.get("spedizione") as string) || undefined,
                            genere: (fd.get("genere") as string) || undefined,
                            tagliaMagliaCotone:
                              (fd.get("tagliaMagliaCotone") as string) || undefined,
                            tagliaMagliaSolar:
                              (fd.get("tagliaMagliaSolar") as string) || undefined,
                            tagliaMagliaPulsar:
                              (fd.get("tagliaMagliaPulsar") as string) || undefined,
                            tagliaCanottaSolar:
                              (fd.get("tagliaCanottaSolar") as string) || undefined,
                            tagliaCanottaPulsar:
                              (fd.get("tagliaCanottaPulsar") as string) || undefined,
                            tagliaFelpaSolar:
                              (fd.get("tagliaFelpaSolar") as string) || undefined,
                            tagliaFelpaPulsar:
                              (fd.get("tagliaFelpaPulsar") as string) || undefined,
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
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Tessera
                            </label>
                            <input
                              name="tessera"
                              defaultValue={m.tessera ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Codice Fiscale
                            </label>
                            <input
                              name="codiceFiscale"
                              defaultValue={m.codiceFiscale ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Luogo nascita
                            </label>
                            <input
                              name="luogoNascita"
                              defaultValue={m.luogoNascita ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Categoria (Cat.)
                            </label>
                            <input
                              name="categoria"
                              defaultValue={m.categoria ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Straniero
                            </label>
                            <input
                              name="straniero"
                              defaultValue={m.straniero ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Genere
                            </label>
                            <input
                              name="genere"
                              defaultValue={m.genere ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Status
                            </label>
                            <input
                              name="status"
                              defaultValue={m.status ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Materiale 2026 consegnato
                            </label>
                            <input
                              name="materiale2026Consegna"
                              defaultValue={m.materiale2026Consegna ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Spedizione
                            </label>
                            <input
                              name="spedizione"
                              defaultValue={m.spedizione ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Indirizzo
                            </label>
                            <input
                              name="indirizzo"
                              defaultValue={m.indirizzo ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              CAP
                            </label>
                            <input
                              name="cap"
                              defaultValue={m.cap ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Città
                            </label>
                            <input
                              name="citta"
                              defaultValue={m.citta ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Prov.
                            </label>
                            <input
                              name="prov"
                              defaultValue={m.prov ?? ""}
                              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                          <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Taglie
                          </p>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Maglia cotone
                              </label>
                              <input
                                name="tagliaMagliaCotone"
                                defaultValue={m.tagliaMagliaCotone ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Maglia Solar
                              </label>
                              <input
                                name="tagliaMagliaSolar"
                                defaultValue={m.tagliaMagliaSolar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Maglia Pulsar
                              </label>
                              <input
                                name="tagliaMagliaPulsar"
                                defaultValue={m.tagliaMagliaPulsar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Canotta Solar
                              </label>
                              <input
                                name="tagliaCanottaSolar"
                                defaultValue={m.tagliaCanottaSolar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Canotta Pulsar
                              </label>
                              <input
                                name="tagliaCanottaPulsar"
                                defaultValue={m.tagliaCanottaPulsar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Felpa Solar
                              </label>
                              <input
                                name="tagliaFelpaSolar"
                                defaultValue={m.tagliaFelpaSolar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Felpa Pulsar
                              </label>
                              <input
                                name="tagliaFelpaPulsar"
                                defaultValue={m.tagliaFelpaPulsar ?? ""}
                                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                              />
                            </div>
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
    </div>
  );
}
