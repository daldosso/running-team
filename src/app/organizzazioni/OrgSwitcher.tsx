"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrgSwitcher({
  currentOrgId,
  organizations,
}: {
  currentOrgId: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "member";
  }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {organizations.map((org) => {
        const active = org.id === currentOrgId;
        return (
          <div
            key={org.id}
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm ${
              active
                ? "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{org.name}</p>
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                  {org.role}
                </span>
              </div>
              <p className="text-sm text-zinc-500">{org.slug}</p>
            </div>
            <button
              type="button"
              disabled={loading !== null || active}
              onClick={async () => {
                setError(null);
                setLoading(org.id);
                try {
                  const res = await fetch("/api/auth/switch-org", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ organizationId: org.id }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setError(data.error || "Errore");
                    return;
                  }
                  router.push("/");
                  router.refresh();
                } catch {
                  setError("Errore di connessione");
                } finally {
                  setLoading(null);
                }
              }}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {active ? "Attiva" : loading === org.id ? "Cambio..." : "Usa questa"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

