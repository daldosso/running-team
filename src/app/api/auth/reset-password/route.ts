import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { token?: string; newPassword?: string }
    | null;

  const token = body?.token?.trim();
  const newPassword = body?.newPassword ?? "";

  if (!token || newPassword.length < 8) {
    return NextResponse.json(
      { error: "token e nuova password (min 8 caratteri) obbligatori" },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const [reset] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!reset) {
    return NextResponse.json({ error: "Token non valido o scaduto" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Con neon-http non sono supportate le transazioni: facciamo i due update in sequenza.
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, reset.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, reset.id));

  return NextResponse.json({ ok: true });
}

