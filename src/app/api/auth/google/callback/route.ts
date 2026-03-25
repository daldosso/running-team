import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";
import { createSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI non configurati",
      },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("rt_google_state")?.value;
  const codeVerifier = cookieStore.get("rt_google_verifier")?.value;
  const next = cookieStore.get("rt_google_next")?.value || "/";

  // clear temp cookies
  cookieStore.set("rt_google_state", "", { path: "/", maxAge: 0 });
  cookieStore.set("rt_google_verifier", "", { path: "/", maxAge: 0 });
  cookieStore.set("rt_google_next", "", { path: "/", maxAge: 0 });

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  const tokenJson = (await tokenRes.json().catch(() => null)) as any;
  if (!tokenRes.ok || !tokenJson?.id_token) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const { payload } = await jwtVerify(tokenJson.id_token as string, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  const name = typeof payload.name === "string" ? payload.name : null;
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    const safeSlugBase = email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "team";
    const slug = `${safeSlugBase}-${Math.random().toString(36).slice(2, 8)}`;
    const [org] = await db
      .insert(organizations)
      .values({ name: `${name ?? "Nuova"} Squadra`, slug })
      .returning();

    const inserted = await db
      .insert(users)
      .values({
        email,
        passwordHash: null,
        name: name ?? email,
        organizationId: org.id,
        role: "owner",
      })
      .returning();
    user = inserted[0];

    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
    });
  } else {
    // assicura che esista la membership sull'org di default
    const existing = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.organizationId, user.organizationId)
        )
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(organizationMembers).values({
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
      });
    }
  }

  await createSessionCookie({
    userId: user.id,
    orgId: user.organizationId,
    role: user.role,
  });

  // compat org-context legacy cookie
  cookieStore.set("running-team-org-id", user.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.redirect(new URL(next, url.origin));
}

