"use client";

import type { Photo } from "@/lib/db/schema";
import Image from "next/image";
import { deletePhoto } from "@/app/actions/photos";
import { useState } from "react";

type RaceOption = { id: string; name: string; raceDate: string };

export function PhotoGrid({
  photos: list,
  races,
}: {
  photos: Photo[];
  races: RaceOption[];
}) {
  const [filterRaceId, setFilterRaceId] = useState<string>("");
  const filtered =
    filterRaceId === ""
      ? list
      : list.filter((p) => p.raceId === filterRaceId);

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        Nessuna foto. Carica la prima con il modulo sopra.
      </p>
    );
  }

  const raceMap = new Map(races.map((r) => [r.id, r.name]));

  return (
    <div>
      {races.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Filtra per gara:</span>
          <select
            value={filterRaceId}
            onChange={(e) => setFilterRaceId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          >
            <option value="">Tutte</option>
            {races.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <Image
              src={p.url}
              alt={p.caption || p.filename}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover"
              unoptimized={p.url.includes("blob.vercel-storage")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {p.caption && (
                <p className="truncate text-xs text-white">{p.caption}</p>
              )}
              {p.raceId && (
                <p className="text-xs text-white/80">
                  {raceMap.get(p.raceId) ?? "Gara"}
                </p>
              )}
              <form
                action={async () => {
                  await deletePhoto(p.id);
                }}
                onSubmit={(e) => {
                  if (!confirm("Eliminare questa foto?")) e.preventDefault();
                }}
                className="mt-1"
              >
                <button
                  type="submit"
                  className="text-xs text-red-300 hover:text-white"
                >
                  Elimina
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
