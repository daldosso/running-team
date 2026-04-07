import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  let payload: { currentPassword?: string; newPassword?: string } | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const currentPassword = payload?.currentPassword?.trim() ?? "";
  const newPassword = payload?.newPassword?.trim() ?? "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La password deve avere almeno 8 caratteri." },
      { status: 400 }
    );
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "La nuova password deve essere diversa." },
      { status: 400 }
    );
  }

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Password attuale non disponibile." },
      { status: 400 }
    );
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Password attuale non valida." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ ok: true });
}
