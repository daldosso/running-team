"use client";

import { useState } from "react";
import { createEvent } from "@/app/actions/events";
import { useRouter } from "next/navigation";

type RaceOption = { id: string; name: string; raceDate: string };

export function EventForm({
  races,
  className = "",
}: {
  races: RaceOption[];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {open ? "Annulla" : "+ Nuovo evento"}
      </button>

      {open && (
        <form
          action={async (fd) => {
            setError(null);
            const res = await createEvent({
              title: (fd.get("title") as string) || "",
              description: (fd.get("description") as string) || undefined,
              date: (fd.get("date") as string) || "",
              time: (fd.get("time") as string) || undefined,
              location: (fd.get("location") as string) || undefined,
              raceId: (fd.get("raceId") as string) || undefined,
            });
            if (!res.ok) {
              setError(res.error ?? "Errore");
              return;
            }
            setOpen(false);
            router.refresh();
          }}
          className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Titolo
              </label>
              <input
                name="title"
                required
                placeholder="Es. Allenamento ripetute"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data
              </label>
              <input
                name="date"
                type="date"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Ora (opzionale)
              </label>
              <input
                name="time"
                type="time"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Luogo (opzionale)
              </label>
              <input
                name="location"
                placeholder="Es. Parco"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Collegato a gara (opzionale)
              </label>
              <select
                name="raceId"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">— Nessuna —</option>
                {races.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.raceDate})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descrizione (opzionale)
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Es. Ritrovo 18:45, 10x400..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
            >
              Annulla
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

