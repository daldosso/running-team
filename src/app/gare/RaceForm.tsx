"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRace } from "@/app/actions/races";

export function RaceForm({ className = "" }: { className?: string }) {
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
        {open ? "Annulla" : "+ Aggiungi gara"}
      </button>

      {open && (
        <form
          action={async (fd) => {
            setError(null);
            const res = await createRace({
              raceDate: (fd.get("raceDate") as string) || "",
              type: (fd.get("type") as string) || "",
              name: (fd.get("name") as string) || "",
              location: (fd.get("location") as string) || "",
              province: (fd.get("province") as string) || undefined,
              distance: (fd.get("distance") as string) || undefined,
              time: (fd.get("time") as string) || undefined,
              infoUrl: (fd.get("infoUrl") as string) || undefined,
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
                Nome gara
              </label>
              <input
                name="name"
                required
                placeholder="Es. Milano Half Marathon"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Data
              </label>
              <input
                name="raceDate"
                type="date"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tipo
              </label>
              <input
                name="type"
                required
                placeholder="Es. STRADA, TRAIL, MEZZA..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Località
              </label>
              <input
                name="location"
                required
                placeholder="Es. Milano"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Provincia (opzionale)
              </label>
              <input
                name="province"
                placeholder="Es. MI"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Distanza (opzionale)
              </label>
              <input
                name="distance"
                placeholder="Es. 21.097"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Orario (opzionale)
              </label>
              <input
                name="time"
                placeholder="Es. 9:30"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Info URL (opzionale)
              </label>
              <input
                name="infoUrl"
                placeholder="https://..."
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
