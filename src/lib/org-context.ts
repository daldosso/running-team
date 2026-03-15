import { cookies } from "next/headers";

/**
 * Contesto organizzazione per multi-tenant.
 * Ordine: cookie (dopo login) > env ORG_ID (deploy per company).
 */
export async function getOrganizationId(): Promise<string | null> {
  if (typeof window !== "undefined") return null;
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("running-team-org-id")?.value;
  if (fromCookie) return fromCookie;
  return process.env.ORG_ID ?? null;
}
