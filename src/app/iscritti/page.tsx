import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { head } from "@vercel/blob";
import { desc, eq } from "drizzle-orm";
import { MemberForm } from "./MemberForm";
import { MembersList } from "./MembersList";

export const dynamic = "force-dynamic";

export default async function IscrittiPage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">
        Configura ORG_ID per vedere gli iscritti.
      </p>
    );
  }

  const list = await db
    .select()
    .from(members)
    .where(eq(members.organizationId, orgId))
    .orderBy(desc(members.createdAt));
  const listWithPhotos = await Promise.all(
    list.map(async (member) => {
      if (!member.photoUrl) return member;
      try {
        const blob = await head(member.photoUrl);
        return { ...member, photoUrl: blob.downloadUrl };
      } catch {
        return member;
      }
    })
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Iscritti</h1>
      <MemberForm className="mb-8" />
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <MembersList members={listWithPhotos} />
      </div>
    </div>
  );
}
