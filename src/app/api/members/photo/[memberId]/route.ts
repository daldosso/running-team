import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { db } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { getOrganizationId } from "@/lib/org-context";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return NextResponse.json(
      { error: "Organizzazione non specificata" },
      { status: 400 }
    );
  }

  const { memberId } = await params;
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
    const result = await get(pathname, { access: "private" });
    if (!result) {
      return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
    }
    const headers = new Headers(result.headers);
    return new NextResponse(result.stream, { status: 200, headers });
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
