"use client";

import type { Photo } from "@/lib/db/schema";
import Image from "next/image";
import { deletePhoto } from "@/app/actions/photos";
import { useEffect, useState } from "react";

type RaceOption = { id: string; name: string; raceDate: string };

export function PhotoGrid({
  photos: list,
  races,
}: {
  photos: Photo[];
  races: RaceOption[];
}) {
  const [filterRaceId, setFilterRaceId] = useState<string>("");
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const filtered =
    filterRaceId === ""
      ? list
      : list.filter((p) => p.raceId === filterRaceId);

  useEffect(() => {
    if (!activePhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePhoto(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activePhoto]);

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
        {filtered.map((p) => {
          const isExternal = p.url.startsWith("http");
          const src = isExternal ? p.url : `/api/photos/${p.id}`;
          return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => setActivePhoto(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActivePhoto(p);
              }
            }}
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-black/60 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-visible:ring-white/60"
          >
            <Image
              src={src}
              alt={p.caption || p.filename}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover"
              unoptimized={isExternal || src.includes("/api/photos/")}
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
                onClick={(e) => e.stopPropagation()}
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
        );
        })}
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              className="absolute right-0 top-0 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-black"
              aria-label="Chiudi"
            >
              Chiudi
            </button>
            {(() => {
              const isExternal = activePhoto.url.startsWith("http");
              const src = isExternal
                ? activePhoto.url
                : `/api/photos/${activePhoto.id}`;
              return (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
                  <Image
                    src={src}
                    alt={activePhoto.caption || activePhoto.filename}
                    fill
                    sizes="(max-width: 1024px) 90vw, 1024px"
                    className="object-contain"
                    unoptimized={isExternal || src.includes("/api/photos/")}
                  />
                </div>
              );
            })()}
            {(activePhoto.caption || activePhoto.raceId) && (
              <div className="mt-3 text-sm text-white">
                {activePhoto.caption && (
                  <p className="truncate">{activePhoto.caption}</p>
                )}
                {activePhoto.raceId && (
                  <p className="text-white/70">
                    {raceMap.get(activePhoto.raceId) ?? "Gara"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
