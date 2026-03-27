import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
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

  const memberId = formData.get("memberId") as string | null;
  const file = formData.get("file") as File | null;

  if (!memberId) {
    return NextResponse.json({ error: "Member ID mancante" }, { status: 400 });
  }

  if (!file || typeof file.size !== "number" || file.size === 0) {
    return NextResponse.json(
      { error: "Seleziona un'immagine valida" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File troppo grande (max ${MAX_SIZE_MB} MB)` },
      { status: 400 }
    );
  }

  const type = file.type?.startsWith("image/") ? file.type : "image/jpeg";
  const ext = file.name?.match(/\.[a-z0-9]+$/i)?.[0] || ".jpg";
  const pathname = `${orgId}/members/${memberId}-${Date.now()}${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: type,
    });

    await db
      .update(members)
      .set({
        photoUrl: blob.pathname,
        updatedAt: new Date(),
      })
      .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)));

    return NextResponse.json({ ok: true, url: blob.pathname });
  } catch (error) {
    console.error("Member photo upload failed", {
      memberId,
      orgId,
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    return NextResponse.json(
      { error: "Upload fallito", details: (error as Error)?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  let payload: { memberId?: string } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  if (!payload?.memberId) {
    return NextResponse.json({ error: "Member ID mancante" }, { status: 400 });
  }

  try {
    await db
      .update(members)
      .set({
        photoUrl: null,
        updatedAt: new Date(),
      })
      .where(and(eq(members.id, payload.memberId), eq(members.organizationId, orgId)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Member photo removal failed", {
      memberId: payload.memberId,
      orgId,
      name: (error as Error)?.name,
      message: (error as Error)?.message,
    });
    return NextResponse.json(
      { error: "Operazione non riuscita", details: (error as Error)?.message },
      { status: 500 }
    );
  }
}
