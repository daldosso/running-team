import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  const { photoId } = await params;
  if (!photoId) {
    return NextResponse.json({ error: "Photo ID mancante" }, { status: 400 });
  }

  const [photo] = await db
    .select({ url: photos.url })
    .from(photos)
    .where(and(eq(photos.id, photoId), eq(photos.organizationId, orgId)));

  if (!photo?.url) {
    return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  }

  if (photo.url.startsWith("http")) {
    return NextResponse.redirect(photo.url);
  }

  const pathname = photo.url;

  try {
    const result = await get(pathname, { access: "private" });
    if (!result) {
      return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
    }
    const headers = new Headers();
    result.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    return new NextResponse(result.stream, { status: 200, headers });
  } catch (error) {
    console.error("Photo fetch failed", {
      photoId,
      orgId,
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    return NextResponse.json(
      { error: "Impossibile recuperare la foto" },
      { status: 500 }
    );
  }
}
