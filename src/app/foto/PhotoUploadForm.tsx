"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

type RaceOption = { id: string; name: string; raceDate: string };

export function PhotoUploadForm({
  races,
  className = "",
}: {
  races: RaceOption[];
  className?: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const files = fd.getAll("file") as File[];
    const hasFile = files.some((f) => f && f.size > 0);
    if (!hasFile) {
      setError("Seleziona almeno un'immagine.");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload fallito");
        return;
      }
      form.reset();
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError("Errore di connessione. Riprova.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Carica foto</h2>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Apri caricamento foto" : "Chiudi caricamento foto"}
          title={collapsed ? "Apri caricamento foto" : "Chiudi caricamento foto"}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-6">

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Immagini
        </label>
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept="image/*"
          multiple
          className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-4 file:py-3 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-300 dark:file:bg-zinc-700 dark:file:text-white dark:hover:file:bg-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Su smartphone puoi scattare una foto o scegliere dalla galleria. Max 4 MB per file.
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Gara (opzionale)
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

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Didascalia (opzionale)
        </label>
        <input
          type="text"
          name="caption"
          placeholder="Es. Arrivo in piazza"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

          <button
            type="submit"
            disabled={uploading}
            className="min-h-[48px] min-w-[120px] rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {uploading ? "Caricamento…" : "Carica"}
          </button>
        </div>
      )}
    </form>
  );
}
