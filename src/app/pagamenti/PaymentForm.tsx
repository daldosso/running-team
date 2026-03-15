"use client";

import { useState } from "react";
import { createPayment } from "@/app/actions/payments";

type MemberOption = { id: string; firstName: string; lastName: string };

export function PaymentForm({
  members,
  className = "",
}: {
  members: MemberOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {open ? "Annulla" : "+ Nuovo pagamento"}
      </button>
      {open && (
        <form
          action={async (fd) => {
            await createPayment({
              memberId: (fd.get("memberId") as string) || undefined,
              amount: fd.get("amount") as string,
              currency: (fd.get("currency") as string) || "EUR",
              description: (fd.get("description") as string) || undefined,
              status: (fd.get("status") as "pending" | "completed") || "pending",
            });
            setOpen(false);
          }}
          className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Iscritto (opzionale)
              </label>
              <select
                name="memberId"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">— Nessuno —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Importo (€)
              </label>
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Stato
              </label>
              <select
                name="status"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="pending">In attesa</option>
                <option value="completed">Completato</option>
              </select>
            </div>
            <div className="hidden">
              <input name="currency" defaultValue="EUR" readOnly />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Descrizione
            </label>
            <input
              name="description"
              placeholder="Es. Quota 2025"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
