"use client";

import { deleteUser } from "@/app/actions/users";

export function DeleteUserForm({ userId }: { userId: string }) {
  return (
    <form
      action={async () => {
        if (!confirm("Eliminare questa utenza?")) return;
        await deleteUser(userId);
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-950/30"
      >
        Elimina
      </button>
    </form>
  );
}
