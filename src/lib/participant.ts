import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** 로그인한 사용자 ID (NextAuth 세션만 사용) */
export async function getParticipantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}
