"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

type Role = "owner" | "admin" | "runner";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  runner: "Runner",
};

export default function NewUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "runner" as Role,
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim() || null,
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok) {
        setError(data?.error ?? "Operazione non riuscita");
        return;
      }

      setSuccess("Utente creato.");
      setForm((prev) => ({ ...prev, name: "", email: "", password: "" }));
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message ?? "Operazione non riuscita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            New user
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Crea una nuova utenza per l&apos;organizzazione corrente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {open ? "Chiudi" : "New user"}
        </button>
      </div>

      {open ? (
        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Nome
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              placeholder="Mario Rossi"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              placeholder="nome@team.it"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              placeholder="Password forte"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Ruolo
            </label>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value as Role,
                }))
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
              {success}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Salvataggio..." : "Crea utente"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setSuccess(null);
              }}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Annulla
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
