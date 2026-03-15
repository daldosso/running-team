"use client";

import { useState } from "react";
import { addCarSharing, removeCarSharing } from "@/app/actions/car-sharing";

type CarSharingRow = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  role: "driver" | "passenger";
  seatsAvailable: string | null;
  notes: string | null;
};

type ParticipantOption = {
  memberId: string;
  firstName: string;
  lastName: string;
};

export function CarSharingSection({
  raceId,
  carSharingList,
  availableMembers,
}: {
  raceId: string;
  carSharingList: CarSharingRow[];
  availableMembers: ParticipantOption[];
}) {
  const [open, setOpen] = useState(false);
  const drivers = carSharingList.filter((c) => c.role === "driver");
  const passengers = carSharingList.filter((c) => c.role === "passenger");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Autisti (offrono passaggio)
          </h3>
          {drivers.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessun autista.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {drivers.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <span>
                    {d.firstName} {d.lastName}
                    {d.seatsAvailable && (
                      <span className="ml-1 text-zinc-500">
                        ({d.seatsAvailable} posti)
                      </span>
                    )}
                    {d.notes && (
                      <span className="ml-1 text-zinc-400"> – {d.notes}</span>
                    )}
                  </span>
                  <form
                    action={async () => {
                      await removeCarSharing(raceId, d.memberId);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      Rimuovi
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Cerco passaggio
          </h3>
          {passengers.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessuno in cerca di passaggio.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {passengers.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>
                    {p.firstName} {p.lastName}
                    {p.notes && (
                      <span className="ml-1 text-zinc-400"> – {p.notes}</span>
                    )}
                  </span>
                  <form
                    action={async () => {
                      await removeCarSharing(raceId, p.memberId);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-red-600 hover:underline dark:text-red-400"
                    >
                      Rimuovi
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {availableMembers.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {open ? "Annulla" : "+ Aggiungiti al car sharing"}
          </button>
          {open && (
            <form
              action={async (fd) => {
                const memberId = fd.get("memberId") as string;
                const role = fd.get("role") as "driver" | "passenger";
                const seatsAvailable = fd.get("seatsAvailable") as string;
                const notes = (fd.get("notes") as string) || undefined;
                if (!memberId || !role) return;
                await addCarSharing(
                  raceId,
                  memberId,
                  role,
                  role === "driver" ? seatsAvailable : undefined,
                  notes
                );
                setOpen(false);
              }}
              className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Sono
                  </label>
                  <select
                    name="memberId"
                    required
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">Seleziona...</option>
                    {availableMembers.map((m) => (
                      <option key={m.memberId} value={m.memberId}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Ruolo
                  </label>
                  <select
                    name="role"
                    required
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="driver">Autista (offro passaggio)</option>
                    <option value="passenger">Cerco passaggio</option>
                  </select>
                </div>
                <div id="seats-field">
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Posti disponibili (solo autista)
                  </label>
                  <input
                    name="seatsAvailable"
                    type="number"
                    min={1}
                    max={9}
                    placeholder="2"
                    className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Note (zona partenza, orario…)
                  </label>
                  <input
                    name="notes"
                    placeholder="Es. partenza Gallarate 7:00"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {availableMembers.length === 0 && carSharingList.length === 0 && (
        <p className="text-sm text-zinc-500">
          Aggiungi prima dei partecipanti alla gara; poi potranno iscriversi al car sharing.
        </p>
      )}
    </div>
  );
}
