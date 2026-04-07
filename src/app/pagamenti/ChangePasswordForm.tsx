"use client";

import { useState } from "react";

type ApiError = { error?: string };

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold">Cambia password</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Inserisci la password attuale e scegli quella nuova.
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setOk(false);

          if (newPassword.length < 8) {
            setError("La password deve avere almeno 8 caratteri.");
            return;
          }
          if (newPassword !== confirm) {
            setError("Le password non coincidono.");
            return;
          }

          setLoading(true);
          try {
            const res = await fetch("/api/auth/change-password", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = (await res.json().catch(() => ({}))) as ApiError;
            if (!res.ok) {
              setError(data.error || "Errore");
              return;
            }
            setOk(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirm("");
          } catch {
            setError("Errore di connessione. Riprova.");
          } finally {
            setLoading(false);
          }
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password attuale
          </label>
          <input
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Nuova password
          </label>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Conferma password
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {ok && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Password aggiornata.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Aggiorno..." : "Aggiorna password"}
        </button>
      </form>
    </div>
  );
}
