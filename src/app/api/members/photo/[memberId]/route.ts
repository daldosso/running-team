import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { memberId: string } }
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  const memberId = params.memberId;
  if (!memberId) {
    return NextResponse.json({ error: "Member ID mancante" }, { status: 400 });
  }

  const [member] = await db
    .select({ photoUrl: members.photoUrl })
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.organizationId, orgId)));

  if (!member?.photoUrl) {
    return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
  }

  const pathname = member.photoUrl.startsWith("http")
    ? new URL(member.photoUrl).pathname.replace(/^\//, "")
    : member.photoUrl;

  try {
    const blob = await get(pathname, { access: "private" });
    const headers = new Headers();
    if (blob.contentType) headers.set("content-type", blob.contentType);
    if (blob.contentDisposition)
      headers.set("content-disposition", blob.contentDisposition);
    if (blob.cacheControl) headers.set("cache-control", blob.cacheControl);
    return new NextResponse(blob.body, { status: 200, headers });
  } catch (error) {
    console.error("Member photo fetch failed", {
      memberId,
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
