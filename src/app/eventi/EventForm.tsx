"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bold, Eye, Italic, Link2, List } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import { createEvent, updateEvent } from "@/app/actions/events";
import { FormattedEventText } from "./FormattedEventText";

type RaceOption = { id: string; name: string; raceDate: string };

function normalizeTextValue(value?: string | null) {
  return value ?? "";
}

function insertAroundSelection(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix = prefix,
  placeholder = "testo"
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const content = selected || placeholder;
  const nextValue =
    textarea.value.slice(0, start) +
    prefix +
    content +
    suffix +
    textarea.value.slice(end);

  const nextCursorStart = start + prefix.length;
  const nextCursorEnd = nextCursorStart + content.length;

  return { nextValue, nextCursorStart, nextCursorEnd };
}

function insertList(textarea: HTMLTextAreaElement) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const content = selected
    ? selected
        .split(/\r?\n/)
        .map((line) => `- ${line}`)
        .join("\n")
    : "- punto elenco";
  const nextValue =
    textarea.value.slice(0, start) + content + textarea.value.slice(end);

  return {
    nextValue,
    nextCursorStart: start,
    nextCursorEnd: start + content.length,
  };
}

export function EventForm({
  races,
  className = "",
  event,
  defaultOpen = false,
  onCancel,
}: {
  races: RaceOption[];
  className?: string;
  event?: Event;
  defaultOpen?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isEditing = Boolean(event);
  const [open, setOpen] = useState(defaultOpen || isEditing);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(
    normalizeTextValue(event?.description)
  );

  const closeForm = () => {
    setError(null);
    setPreview(false);
    setOpen(false);
    setDescriptionValue(normalizeTextValue(event?.description));
    onCancel?.();
  };

  const applyFormatting = (
    formatter: (textarea: HTMLTextAreaElement) => {
      nextValue: string;
      nextCursorStart: number;
      nextCursorEnd: number;
    }
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { nextValue, nextCursorStart, nextCursorEnd } = formatter(textarea);
    setDescriptionValue(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursorStart, nextCursorEnd);
    });
  };

  return (
    <div className={className}>
      {!isEditing && (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {open ? "Annulla" : "+ Nuovo evento"}
        </button>
      )}

      {open && (
        <form
          action={async (fd) => {
            setError(null);
            const payload = {
              title: (fd.get("title") as string) || "",
              description: (fd.get("description") as string) || undefined,
              date: (fd.get("date") as string) || "",
              time: (fd.get("time") as string) || undefined,
              location: (fd.get("location") as string) || undefined,
              raceId: (fd.get("raceId") as string) || undefined,
            };
            const res = isEditing && event
              ? await updateEvent(event.id, payload)
              : await createEvent(payload);
            if (!res.ok) {
              setError(res.error ?? "Errore");
              return;
            }
            if (!isEditing) {
              setOpen(false);
              setDescriptionValue("");
            } else {
              onCancel?.();
            }
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
                defaultValue={event?.title ?? ""}
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
                defaultValue={event?.date ?? ""}
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
                defaultValue={event?.time ?? ""}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Luogo (opzionale)
              </label>
              <input
                name="location"
                defaultValue={event?.location ?? ""}
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
                defaultValue={event?.raceId ?? ""}
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
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Descrizione (Markdown leggero)
                </label>
                <button
                  type="button"
                  onClick={() => setPreview((current) => !current)}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium dark:border-zinc-600"
                >
                  <Eye size={14} />
                  {preview ? "Modifica" : "Anteprima"}
                </button>
              </div>

              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyFormatting((textarea) =>
                      insertAroundSelection(textarea, "**", "**", "grassetto")
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  title="Grassetto"
                >
                  <Bold size={14} />
                  Grassetto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatting((textarea) =>
                      insertAroundSelection(textarea, "_", "_", "corsivo")
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  title="Corsivo"
                >
                  <Italic size={14} />
                  Corsivo
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting((textarea) => insertList(textarea))}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  title="Elenco puntato"
                >
                  <List size={14} />
                  Elenco
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyFormatting((textarea) =>
                      insertAroundSelection(
                        textarea,
                        "[",
                        "](https://esempio.it)",
                        "testo link"
                      )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  title="Link"
                >
                  <Link2 size={14} />
                  Link
                </button>
              </div>

              <input type="hidden" name="description" value={descriptionValue} />

              {preview ? (
                <div className="min-h-32 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                  {descriptionValue.trim() ? (
                    <FormattedEventText text={descriptionValue} />
                  ) : (
                    <p className="text-zinc-500">Nessuna descrizione da mostrare.</p>
                  )}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  rows={6}
                  value={descriptionValue}
                  onChange={(event) => setDescriptionValue(event.target.value)}
                  placeholder={"Es. Ritrovo 18:45\n- 10x400\n- recupero 1'\n[Dettagli](https://esempio.it)"}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              )}

              <p className="mt-2 text-xs text-zinc-500">
                Supporta `**grassetto**`, `_corsivo_`, `- elenco`, `[testo](https://url)`.
              </p>
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
