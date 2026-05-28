"use client";

import { Fragment, useState } from "react";
import type { Race } from "@/lib/db/schema";
import Link from "next/link";
import { Edit2, Trash2 } from "lucide-react";
import { deleteRace } from "@/app/actions/races";
import { RaceForm } from "./RaceForm";

export function RacesList({
  races: list,
  canManage = false,
}: {
  races: Race[];
  canManage?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessuna gara. Chiama POST /api/seed-races per importare il calendario.
      </p>
    );
  }

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {list.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/gare/${r.id}`}
                className="text-sm font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                {r.name}
              </Link>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">
                {r.type}
              </span>
            </div>
            <div className="mt-2 text-xs text-zinc-500">{formatDate(r.raceDate)}</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {r.location}
              {r.province ? ` (${r.province})` : ""}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {r.distance ? `${r.distance} km` : "Distanza —"}
            </div>
            {canManage && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId((current) => (current === r.id ? null : r.id))}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  title="Modifica"
                >
                  <Edit2 size={16} />
                </button>
                <form
                  action={async () => {
                    await deleteRace(r.id);
                  }}
                  onSubmit={(e) => {
                    if (!confirm("Eliminare questa gara dall'elenco?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            )}
            {editingId === r.id ? (
              <RaceForm
                race={r}
                defaultOpen
                onCancel={() => setEditingId(null)}
                className="mt-3"
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Gara</th>
              <th className="px-4 py-3 font-medium">Luogo</th>
              <th className="px-4 py-3 font-medium">Pr.</th>
              <th className="px-4 py-3 font-medium">Km</th>
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <Fragment key={r.id}>
              <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="whitespace-nowrap px-4 py-3">{formatDate(r.raceDate)}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                    {r.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/gare/${r.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-white"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{r.location}</td>
                <td className="px-4 py-3 text-zinc-500">{r.province ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{r.distance ?? "—"}</td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId((current) => (current === r.id ? null : r.id))}
                        className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                        title="Modifica"
                      >
                        <Edit2 size={16} />
                      </button>
                      <form
                        action={async () => {
                          await deleteRace(r.id);
                        }}
                        onSubmit={(e) => {
                          if (!confirm("Eliminare questa gara dall'elenco?")) e.preventDefault();
                        }}
                      >
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </td>
              </tr>
              {editingId === r.id ? (
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={7} className="px-4 py-4">
                    <RaceForm
                      race={r}
                      defaultOpen
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
