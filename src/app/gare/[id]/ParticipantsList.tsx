"use client";

import { removeParticipant } from "@/app/actions/races";

type Participant = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  notes: string | null;
};

export function ParticipantsList({
  raceId,
  participants,
}: {
  raceId: string;
  participants: Participant[];
}) {
  if (participants.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-6 text-center text-zinc-500 dark:border-zinc-600">
        Nessun partecipante. Aggiungi iscritti con il pulsante sopra.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Note</th>
            <th className="w-20 px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr
              key={p.id}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-3">
                {p.firstName} {p.lastName}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.email}</td>
              <td className="px-4 py-3 text-zinc-500">{p.notes ?? "—"}</td>
              <td className="px-4 py-3">
                <form
                  action={async () => {
                    await removeParticipant(raceId, p.memberId);
                  }}
                  onSubmit={(e) => {
                    if (!confirm("Rimuovere questo partecipante dalla gara?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Rimuovi
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
