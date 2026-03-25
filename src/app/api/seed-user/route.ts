import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Crea un utente demo per sviluppo:
 * email: demo@running-team.it
 * password: Password123!
 * role: owner
 *
 * Se non esiste un'organizzazione, crea "Squadra Demo".
 */
export async function POST() {
  const email = "demo@running-team.it";

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return NextResponse.json({
      message: "Utente demo già presente.",
      email,
      password: "Password123!",
    });
  }

  let [org] = await db.select().from(organizations).limit(1);
  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: "Squadra Demo", slug: "squadra-demo" })
      .returning();
  }

  const passwordHash = await bcrypt.hash("Password123!", 10);
  await db.insert(users).values({
    email,
    passwordHash,
    name: "Demo Owner",
    organizationId: org.id,
    role: "owner",
  });

  return NextResponse.json({
    message: "Utente demo creato.",
    email,
    password: "Password123!",
    organizationId: org.id,
  });
}

