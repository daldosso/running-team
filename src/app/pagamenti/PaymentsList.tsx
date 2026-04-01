"use client";

import type { Payment } from "@/lib/db/schema";
import { Trash2 } from "lucide-react";
import { updatePaymentStatus, deletePayment } from "@/app/actions/payments";

type MemberOption = { id: string; firstName: string; lastName: string };

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  completed: "Completato",
  failed: "Fallito",
  refunded: "Rimborsato",
};

export function PaymentsList({
  payments: list,
  members,
  canManage = false,
}: {
  payments: Payment[];
  members: MemberOption[];
  canManage?: boolean;
}) {
  const memberMap = new Map(members.map((m) => [m.id, `${m.firstName} ${m.lastName}`]));

  if (list.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 py-8 text-center text-zinc-500 dark:border-zinc-600">
        {canManage
          ? "Nessun pagamento. Aggiungi il primo con + Nuovo pagamento."
          : "Non risultano pagamenti associati al tuo profilo."}
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {list.map((p) => {
          const amount = Number(p.amount).toLocaleString("it-IT", {
            minimumFractionDigits: 2,
          });
          const dateLabel = p.paidAt
            ? new Date(p.paidAt).toLocaleDateString("it-IT")
            : new Date(p.createdAt).toLocaleDateString("it-IT");
          return (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    € {amount}
                  </div>
                  <div className="text-xs text-zinc-500">{dateLabel}</div>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : p.status === "pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {statusLabels[p.status] ?? p.status}
                </span>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                {p.memberId ? memberMap.get(p.memberId) ?? "—" : "—"}
              </div>
              <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                {p.description ?? "—"}
              </div>
              {canManage ? (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {p.status === "pending" && (
                    <form
                      action={async () => {
                        await updatePaymentStatus(p.id, "completed");
                      }}
                    >
                      <button
                        type="submit"
                        className="text-green-600 hover:underline dark:text-green-400"
                      >
                        Segna pagato
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      await deletePayment(p.id);
                    }}
                    onSubmit={(e) => {
                      if (!confirm("Eliminare questo pagamento?")) e.preventDefault();
                    }}
                  >
                    <button
                      type="submit"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <th className="px-4 py-3 font-medium">Importo</th>
              <th className="px-4 py-3 font-medium">Iscritto</th>
              <th className="px-4 py-3 font-medium">Descrizione</th>
              <th className="px-4 py-3 font-medium">Stato</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="w-32 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr
                key={p.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3 font-medium">
                  € {Number(p.amount).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.memberId ? memberMap.get(p.memberId) ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.description ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : p.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.paidAt
                    ? new Date(p.paidAt).toLocaleDateString("it-IT")
                    : new Date(p.createdAt).toLocaleDateString("it-IT")}
                </td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <div className="flex gap-2">
                      {p.status === "pending" && (
                        <form
                          action={async () => {
                            await updatePaymentStatus(p.id, "completed");
                          }}
                        >
                          <button
                            type="submit"
                            className="text-green-600 hover:underline dark:text-green-400"
                          >
                            Segna pagato
                          </button>
                        </form>
                      )}
                      <form
                        action={async () => {
                          await deletePayment(p.id);
                        }}
                        onSubmit={(e) => {
                          if (!confirm("Eliminare questo pagamento?")) e.preventDefault();
                        }}
                      >
                        <button
                          type="submit"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Elimina"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
