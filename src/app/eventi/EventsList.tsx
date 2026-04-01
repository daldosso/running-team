"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/schema";
import { Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/actions/events";

type RaceOption = { id: string; name: string; raceDate: string };

export function EventsList({
  events: list,
  races,
}: {
  events: Event[];
  races: RaceOption[];
}) {
  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessun evento. Aggiungi il primo con “+ Nuovo evento”.
      </p>
    );
  }

  const raceMap = new Map(races.map((r) => [r.id, r.name]));

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 font-medium">Evento</th>
            <th className="px-4 py-3 font-medium">Luogo</th>
            <th className="px-4 py-3 font-medium">Gara</th>
            <th className="w-24 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr
              key={e.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="whitespace-nowrap px-4 py-3">
                {formatDate(e.date)}
                {e.time ? (
                  <span className="ml-2 text-zinc-500">ore {e.time}</span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/eventi/${e.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-white"
                >
                  {e.title}
                </Link>
                {e.description ? (
                  <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                    {e.description}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {e.location ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {e.raceId ? raceMap.get(e.raceId) ?? "—" : "—"}
              </td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    await deleteEvent(e.id);
                  }}
                  onSubmit={(ev) => {
                    if (!confirm("Eliminare questo evento?")) ev.preventDefault();
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

