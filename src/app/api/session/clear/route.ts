import { NextResponse } from "next/server";

/** 로그아웃은 상단 '로그아웃' 버튼을 사용하세요. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
