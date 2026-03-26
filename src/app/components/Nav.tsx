"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "./LogoutButton";

type SessionRole = "owner" | "admin" | "runner" | null;

export function Nav() {
  const [role, setRole] = useState<SessionRole>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data:
            | { role?: SessionRole; orgName?: string | null; orgSlug?: string | null }
            | null
        ) => {
          if (!cancelled) setRole(data?.role ?? null);
          if (!cancelled) setOrgName(data?.orgName ?? null);
          if (!cancelled) setOrgSlug(data?.orgSlug ?? null);
        }
      )
      .catch(() => {
        if (!cancelled) setRole(null);
        if (!cancelled) setOrgName(null);
        if (!cancelled) setOrgSlug(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = role === "owner" || role === "admin";
  const isRunFast = orgSlug === "run-fast";
  const brandName = orgName ?? (isRunFast ? "Run Fast" : "Running Team");
  const logoSrc = isRunFast
    ? "https://www.runfast.it/wp-content/uploads/2017/12/Logo-Run-Fast.png"
    : "/running-team-logo.png";

  return (
    <nav className="border-b border-zinc-200 bg-white/80 shadow-[0_6px_30px_rgba(3,8,20,0.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white"
        >
          <Image
            src={logoSrc}
            alt={brandName}
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          {brandName}
        </Link>
        <div className="flex flex-1 items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/iscritti"
                className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
              >
                Iscritti
              </Link>
              <Link
                href="/pagamenti"
                className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
              >
                Pagamenti
              </Link>
            </>
          )}
          <Link
            href="/gare"
            className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            Gare
          </Link>
          <Link
            href="/foto"
            className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            Foto
          </Link>
          <Link
            href="/eventi"
            className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            Eventi
          </Link>
          <div className="flex-1" />
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
