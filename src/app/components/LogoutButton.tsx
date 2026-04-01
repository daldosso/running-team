"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="inline-flex items-center justify-center rounded-full p-2 text-zinc-700 transition-all duration-200 hover:bg-white/80 hover:text-zinc-900 hover:ring-1 hover:ring-zinc-200/80 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:text-zinc-300 dark:hover:bg-zinc-900/70 dark:hover:text-white dark:hover:ring-zinc-700/80 dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)] dark:focus-visible:ring-zinc-500/80"
      title="Esci"
    >
      <LogOut size={20} />
    </button>
  );
}
