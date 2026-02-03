import { NextResponse } from "next/server";

/** 참여자 쿠키 설정 기능 제거됨. 로그인을 사용하세요. */
export async function POST() {
  return NextResponse.json(
    { error: "이 기능은 더 이상 사용되지 않습니다. 로그인해 주세요." },
    { status: 410 }
  );
}
