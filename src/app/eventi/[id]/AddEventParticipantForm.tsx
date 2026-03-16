"use client";

import { useState } from "react";
import { addEventParticipant } from "@/app/actions/events";

type MemberOption = { id: string; firstName: string; lastName: string };

export function AddEventParticipantForm({
  eventId,
  availableMembers,
  className = "",
}: {
  eventId: string;
  availableMembers: MemberOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (availableMembers.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Tutti gli iscritti sono già in questo evento (o non ci sono iscritti).
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {open ? "Annulla" : "+ Aggiungi partecipante"}
      </button>
      {open && (
        <form
          action={async (fd) => {
            const memberId = fd.get("memberId") as string;
            if (!memberId) return;
            await addEventParticipant(eventId, memberId, fd.get("notes") as string);
            setOpen(false);
          }}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Iscritto
            </label>
            <select
              name="memberId"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Seleziona...</option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Note (opzionale)
            </label>
            <input
              name="notes"
              placeholder="Es. arrivo in ritardo"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Aggiungi
          </button>
        </form>
      )}
    </div>
  );
}

