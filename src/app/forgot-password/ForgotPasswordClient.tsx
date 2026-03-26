"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ForgotPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/login";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight">
          Password dimenticata
        </h1>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            setMessage(null);
            setResetLink(null);
            try {
              const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data.error || "Errore");
                return;
              }
              setMessage(data.message || null);
              setResetLink(data.resetLink || null);
            } catch {
              setError("Errore di connessione. Riprova.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {message && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {message}
            </p>
          )}

          {resetLink && (
            <a
              href={resetLink}
              className="block rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Vai al link per cambiare password
            </a>
          )}

          <button
            type="button"
            onClick={() => router.push(next)}
            className="min-h-[48px] w-full rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Torna al login
          </button>

          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Invio..." : "Invia link"}
          </button>
        </form>
      </div>
    </div>
  );
}