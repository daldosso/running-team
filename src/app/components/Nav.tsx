"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

type SessionRole = "owner" | "admin" | "runner" | null;

export function Nav() {
  const [role, setRole] = useState<SessionRole>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);
  const pathname = usePathname();

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
  const isRunner = role === "runner";
  const normalizedSlug = orgSlug
    ? orgSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : "";
  const isRunFast =
    normalizedSlug === "run-fast" ||
    (orgName ? orgName.toLowerCase().includes("run fast") : false);
  const brandName = orgName ?? (isRunFast ? "Run Fast" : "Running Team");
  const logoSrc = isRunFast
    ? "/Logo-Run-Fast-White.png"
    : "/running-team-logo.png";

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navItemClass = (href: string) => {
    const base =
      "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:focus-visible:ring-zinc-500/80";
    const active =
      "bg-zinc-900 !text-white hover:!text-white shadow-[0_8px_20px_rgba(15,23,42,0.25)] ring-1 ring-zinc-900/10 hover:bg-zinc-900 dark:bg-white/90 dark:!text-zinc-900 dark:hover:!text-zinc-900 dark:hover:bg-white/90";
    const inactive =
      "text-zinc-700 hover:bg-white/80 hover:text-zinc-900 hover:ring-1 hover:ring-zinc-200/80 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:text-zinc-300 dark:hover:bg-zinc-900/70 dark:hover:text-white dark:hover:ring-zinc-700/80 dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)]";
    return `${base} ${isActive(href) ? active : inactive}`;
  };

  return (
    <nav className="border-b border-zinc-200 bg-white/80 shadow-[0_6px_30px_rgba(3,8,20,0.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="flex items-center text-base font-semibold text-zinc-900 dark:text-white"
        >
          <Image
            src={logoSrc}
            alt={brandName}
            width={48}
            height={48}
            className="h-16 w-16 object-contain sm:h-14 sm:w-14 dark:invert dark:brightness-200"
          />
        </Link>
        <div className="flex flex-1 items-center gap-2">
          {isAdmin && (
            <Link
              href="/"
              className={navItemClass("/")}
              aria-current={isActive("/") ? "page" : undefined}
            >
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/iscritti"
              className={navItemClass("/iscritti")}
              aria-current={isActive("/iscritti") ? "page" : undefined}
            >
              Iscritti
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/utenze"
              className={navItemClass("/utenze")}
              aria-current={isActive("/utenze") ? "page" : undefined}
            >
              Users
            </Link>
          )}
          {(isAdmin || isRunner) && (
            <Link
              href="/pagamenti"
              className={navItemClass("/pagamenti")}
              aria-current={isActive("/pagamenti") ? "page" : undefined}
            >
              {isRunner ? "Profilo" : "Pagamenti"}
            </Link>
          )}
          <Link
            href="/gare"
            className={navItemClass("/gare")}
            aria-current={isActive("/gare") ? "page" : undefined}
          >
            Gare
          </Link>
          <Link
            href="/foto"
            className={navItemClass("/foto")}
            aria-current={isActive("/foto") ? "page" : undefined}
          >
            Foto
          </Link>
          <Link
            href="/eventi"
            className={navItemClass("/eventi")}
            aria-current={isActive("/eventi") ? "page" : undefined}
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
