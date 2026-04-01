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
      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      title="Esci"
    >
      <LogOut size={20} />
    </button>
  );
}

