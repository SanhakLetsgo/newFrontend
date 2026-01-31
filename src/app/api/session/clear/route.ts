import { NextResponse } from "next/server";
import { clearParticipantCookieHeader } from "@/lib/participant";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") ?? "/";
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  Object.entries(clearParticipantCookieHeader()).forEach(([key, value]) => {
    res.headers.append(key, value);
  });
  return res;
}
