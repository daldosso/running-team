import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSessionCookie();
  const cookieStore = await cookies();
  cookieStore.set("running-team-org-id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}

