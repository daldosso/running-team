import Image from "next/image";
import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white"
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
        <div className="flex gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/iscritti"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Iscritti
          </Link>
          <Link
            href="/pagamenti"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Pagamenti
          </Link>
          <Link
            href="/gare"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Gare
          </Link>
          <Link
            href="/foto"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Foto
          </Link>
          <Link
            href="/eventi"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Eventi
          </Link>
        </div>
      </div>
    </nav>
  );
}
