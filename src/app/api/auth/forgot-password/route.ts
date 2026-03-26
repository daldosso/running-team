import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string }
    | null;

  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email obbligatoria" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Non riveliamo se l'utente esiste: messaggio sempre generico.
  if (!user) {
    return NextResponse.json({
      message:
        "Se l'email esiste, ti invieremo un link per reimpostare la password.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora

  // Invaliadiamo eventuali token vecchi (soft) marcandoli come usati.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.userId, user.id));

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetBaseUrl =
    process.env.PASSWORD_RESET_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(request.url).origin;

  const message =
    "Se l'email esiste, ti invieremo un link per reimpostare la password.";

  // In mancanza di servizio email, restituiamo il link (dev). In production lo puoi gestire sostituendo questa parte.
  return NextResponse.json({
    message,
    resetLink: `${resetBaseUrl}/reset-password?token=${encodeURIComponent(
      token
    )}`,
  });
}

