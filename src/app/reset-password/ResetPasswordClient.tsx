"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiError = { error?: string };

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setError(null);
    setOk(false);
  }, [token]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight">Cambia password</h1>

        {!token && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Token mancante.
          </p>
        )}

        {ok && (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100">
            Password aggiornata. Puoi accedere con la nuova password.
          </div>
        )}

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setOk(false);

            if (!token) {
              setError("Token mancante.");
              return;
            }

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
              const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
              });
              const data = (await res.json().catch(() => ({}))) as ApiError;
              if (!res.ok) {
                setError(data.error || "Errore");
                return;
              }
              setOk(true);
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

          <button
            type="submit"
            disabled={loading || !token}
            className="min-h-[48px] w-full rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Aggiorno..." : "Aggiorna password"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="min-h-[48px] w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Torna al login
          </button>
        </form>
      </div>
    </div>
  );
}