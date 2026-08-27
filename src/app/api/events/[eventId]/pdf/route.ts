import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { get, put } from "@vercel/blob";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_SIZE_MB = 12;
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

function buildAttachmentName(filename: string | null | undefined, fallback: string) {
  const raw = (filename || fallback).trim() || fallback;
  return raw.replace(/["\r\n]/g, "_");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  const { eventId } = await params;
  const [event] = await db
    .select({
      pdfUrl: events.pdfUrl,
      pdfFilename: events.pdfFilename,
      title: events.title,
    })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));

  if (!event?.pdfUrl) {
    return NextResponse.json({ error: "PDF non trovato" }, { status: 404 });
  }

  if (event.pdfUrl.startsWith("http")) {
    return NextResponse.redirect(event.pdfUrl);
  }

  try {
    const result = await get(event.pdfUrl, { access: "private" });
    if (!result) {
      return NextResponse.json({ error: "PDF non trovato" }, { status: 404 });
    }

    const headers = new Headers();
    result.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    headers.set("content-disposition", `attachment; filename="${buildAttachmentName(event.pdfFilename, `${event.title}.pdf`)}"`);

    return new NextResponse(result.stream, { status: 200, headers });
  } catch (error) {
    console.error("Event PDF fetch failed", {
      eventId,
      orgId,
      message: (error as Error)?.message,
    });
    return NextResponse.json(
      { error: "Impossibile recuperare il PDF" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "admin")) {
    return NextResponse.json({ error: "Operazione non consentita" }, { status: 403 });
  }

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

  const { eventId } = await params;
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Info non trovata" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || typeof file.size !== "number" || file.size === 0) {
    return NextResponse.json({ error: "Seleziona un PDF valido" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File troppo grande (max ${MAX_SIZE_MB} MB)` },
      { status: 400 }
    );
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Carica un file PDF" }, { status: 400 });
  }

  const pathname = `${orgId}/events/${eventId}-${Date.now()}.pdf`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/pdf",
  });

  await db
    .update(events)
    .set({
      pdfUrl: blob.pathname,
      pdfFilename: file.name || "documento.pdf",
    })
    .where(and(eq(events.id, eventId), eq(events.organizationId, orgId)));

  revalidatePath("/eventi");
  revalidatePath(`/eventi/${eventId}`);

  return NextResponse.json({ ok: true, url: blob.pathname });
}
