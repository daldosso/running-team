import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "running-team-session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/organizzazioni") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Allow public assets in root (e.g. /running-team-logo.png)
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i)) {
    return NextResponse.next();
  }

  const ok = await hasValidSession(req);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static files.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};

