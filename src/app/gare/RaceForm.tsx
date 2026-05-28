"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Race } from "@/lib/db/schema";
import { createRace, updateRace } from "@/app/actions/races";

export function RaceForm({
  className = "",
  race,
  defaultOpen = false,
  onCancel,
}: {
  className?: string;
  race?: Race;
  defaultOpen?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(race);
  const [open, setOpen] = useState(defaultOpen || isEditing);
  const [error, setError] = useState<string | null>(null);

  const closeForm = () => {
    setError(null);
    setOpen(false);
    onCancel?.();
  };

  return (
    <div className={className}>
      {!isEditing && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {open ? "Annulla" : "+ Aggiungi gara"}
        </button>
      )}

      {open && (
        <form
          action={async (fd) => {
            setError(null);
            const payload = {
              raceDate: (fd.get("raceDate") as string) || "",
              type: (fd.get("type") as string) || "",
              name: (fd.get("name") as string) || "",
              location: (fd.get("location") as string) || "",
              province: (fd.get("province") as string) || undefined,
              distance: (fd.get("distance") as string) || undefined,
              time: (fd.get("time") as string) || undefined,
              infoUrl: (fd.get("infoUrl") as string) || undefined,
            };
            const res = isEditing && race
              ? await updateRace(race.id, payload)
              : await createRace(payload);
            if (!res.ok) {
              setError(res.error ?? "Errore");
              return;
            }
            if (isEditing) onCancel?.();
            else setOpen(false);
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
                defaultValue={race?.name ?? ""}
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
                defaultValue={race?.raceDate ?? ""}
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
                defaultValue={race?.type ?? ""}
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
                defaultValue={race?.location ?? ""}
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
                defaultValue={race?.province ?? ""}
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
                defaultValue={race?.distance ?? ""}
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
                defaultValue={race?.time ?? ""}
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
                defaultValue={race?.infoUrl ?? ""}
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
              {isEditing ? "Aggiorna" : "Salva"}
            </button>
            <button
              type="button"
              onClick={closeForm}
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
