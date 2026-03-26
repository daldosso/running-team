"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";

export function ConditionalNav() {
  const pathname = usePathname();

  if (!pathname) return null;
  if (pathname?.startsWith("/login")) return null;

  return <Nav />;
}

