import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function base64url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sha256base64url(value: string) {
  return base64url(crypto.createHash("sha256").update(value).digest());
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID o GOOGLE_REDIRECT_URI non configurati" },
      { status: 500 }
    );
  }

  const state = base64url(crypto.randomBytes(32));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = sha256base64url(codeVerifier);

  const cookieStore = await cookies();
  cookieStore.set("rt_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set("rt_google_verifier", codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  cookieStore.set("rt_google_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}

