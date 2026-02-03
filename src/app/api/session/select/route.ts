import { NextResponse } from "next/server";

/** 참여자 이름 선택 기능 제거됨. 로그인/회원가입을 사용하세요. */
export async function POST(req: Request) {
  const base = new URL(req.url).origin;
  return NextResponse.redirect(new URL("/login", base));
}
