import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/workouts", "/papers"];

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const participantId = req.cookies.get("participant_id")?.value;
  if (isProtected(req.nextUrl.pathname) && !participantId) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/workouts", "/workouts/:path*", "/papers", "/papers/:path*"],
};
