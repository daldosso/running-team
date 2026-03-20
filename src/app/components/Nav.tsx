import Image from "next/image";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-zinc-200 bg-white/80 shadow-[0_6px_30px_rgba(3,8,20,0.35)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white"
        >
          <Image
            src="/running-team-logo.png"
            alt="Running Team"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          Running Team
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            Dashboard
          </Link>
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
        </div>
      </div>
    </nav>
  );
}
