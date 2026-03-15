import { getOrganizationId } from "@/lib/org-context";
import { db } from "@/lib/db";
import { photos, races } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { PhotoUploadForm } from "./PhotoUploadForm";
import { PhotoGrid } from "./PhotoGrid";

export const dynamic = "force-dynamic";

export default async function FotoPage() {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return (
      <p className="text-zinc-500">Configura ORG_ID per vedere le foto.</p>
    );
  }

  const [photosList, racesList] = await Promise.all([
    db
      .select()
      .from(photos)
      .where(eq(photos.organizationId, orgId))
      .orderBy(desc(photos.createdAt)),
    db
      .select({ id: races.id, name: races.name, raceDate: races.raceDate })
      .from(races)
      .where(eq(races.organizationId, orgId))
      .orderBy(desc(races.raceDate)),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Foto</h1>

      <PhotoUploadForm races={racesList} className="mb-8" />

      <PhotoGrid photos={photosList} races={racesList} />
    </div>
  );
}
