import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e password obbligatorie" },
      { status: 400 }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  await createSessionCookie({
    userId: user.id,
    orgId: user.organizationId,
    role: user.role,
  });

  // mantiene compatibilità col vecchio metodo org-context
  const cookieStore = await cookies();
  cookieStore.set("running-team-org-id", user.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}

