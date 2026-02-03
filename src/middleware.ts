import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 로그인 체크는 각 보호된 페이지(workouts, papers, ps)에서 getServerSession으로 수행.
// Edge의 getToken이 쿠키/세션을 읽지 못하는 경우가 있어, 서버 컴포넌트에서 redirect 처리.
export async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
