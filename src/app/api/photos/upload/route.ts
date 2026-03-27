import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 4;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Storage non configurato (BLOB_READ_WRITE_TOKEN)" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida" },
      { status: 400 }
    );
  }

  const raceId = formData.get("raceId") as string | null;
  const caption = (formData.get("caption") as string) || null;
  const files = formData.getAll("file") as File[];

  if (!files.length || (files.length === 1 && files[0].size === 0)) {
    return NextResponse.json(
      { error: "Seleziona almeno un'immagine" },
      { status: 400 }
    );
  }

  const uploaded: { id: string; url: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || typeof file.size !== "number") continue;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File "${file.name}" troppo grande (max ${MAX_SIZE_MB} MB)` },
        { status: 400 }
      );
    }
    const type = file.type?.startsWith("image/") ? file.type : "image/jpeg";
    const ext = file.name?.match(/\.[a-z0-9]+$/i)?.[0] || ".jpg";
    const pathname = `${orgId}/${Date.now()}-${i}${ext}`;

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: type,
    });

    const [row] = await db
      .insert(photos)
      .values({
        organizationId: orgId,
        raceId: raceId || null,
        url: blob.pathname,
        filename: file.name || pathname,
        caption: caption && i === 0 ? caption : null,
      })
      .returning({ id: photos.id, url: photos.url });

    if (row) uploaded.push({ id: row.id, url: row.url });
  }

  return NextResponse.json({
    ok: true,
    count: uploaded.length,
    photos: uploaded,
  });
}
