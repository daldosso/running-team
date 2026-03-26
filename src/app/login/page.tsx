"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>

        <a
          href={`/api/auth/google?next=${encodeURIComponent(nextPath)}`}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 48 48"
            fill="none"
          >
            <path
              d="M44.5 20H24v8.5h11.8c-1.6 4.7-6.1 8.1-11.8 8.1-7.1 0-12.8-5.7-12.8-12.8S16.9 10 24 10c3.4 0 6.5 1.3 8.8 3.5l6-6C35.1 4.5 29.9 2.2 24 2.2 11.3 2.2 1 12.5 1 25.2S11.3 48.2 24 48.2c12 0 21.5-8.6 21.5-20.8 0-1.4-.2-2.7-.5-4z"
              fill="#4285F4"
            />
            <path
              d="M6.9 14.3l7 5.1C15.8 16 19.6 12.9 24 12.9c3.4 0 6.5 1.3 8.8 3.5l6-6C35.1 4.5 29.9 2.2 24 2.2c-6.9 0-13 3.6-17.1 9.1z"
              fill="#34A853"
            />
            <path
              d="M24 48.2c5.8 0 11-2.3 14.7-6.1l-6.8-5.6c-2 1.3-4.5 2.2-7.9 2.2-5.7 0-10.6-3.6-12.3-8.7l-7.1 5.5c3.9 7.4 11.6 12.7 19.4 12.7z"
              fill="#FBBC05"
            />
            <path
              d="M11.7 29.1c-0.5-1.5-0.8-3.1-0.8-4.8s0.3-3.3 0.8-4.8l-7-5.1C3 16.6 2 20.8 2 24.3s1 7.7 2.7 10.6l7-5.8z"
              fill="#EA4335"
            />
          </svg>
          Continua con Google
        </a>

        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              const form = e.currentTarget as HTMLFormElement;
              const fd = new FormData(form);
              const email = String(fd.get("email") || "");
              const password = String(fd.get("password") || "");

              const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                setError(data.error || "Login fallito");
                return;
              }
              router.push(nextPath);
              router.refresh();
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
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] w-full rounded-lg bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

