import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: problemId } = await params;
  const problem = await prisma.codingBattleProblem.findUnique({
    where: { id: problemId },
  });
  if (!problem) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
  }
  type SubRow = {
    userId: string;
    executionTimeMs: number | null;
    completedAt: Date | null;
    user: { name: string | null } | null;
  };
  const submissions = (await prisma.codingBattleSubmission.findMany({
    where: { problemId, completedAt: { not: null } },
    include: { user: { select: { id: true, name: true } } },
  })) as unknown as SubRow[];
  type WithTimeRow = {
    userId: string;
    name: string;
    timeSeconds: number | null;
    executionTimeMs: number | null;
    completedAt: Date | null;
  };
  const withTime: WithTimeRow[] = submissions.map((s: SubRow) => {
    const executionMs = s.executionTimeMs ?? null;
    return {
      userId: s.userId,
      name: s.user?.name ?? "이름 없음",
      timeSeconds: executionMs != null ? executionMs / 1000 : null,
      executionTimeMs: executionMs,
      completedAt: s.completedAt,
    };
  });
  withTime.sort((a: WithTimeRow, b: WithTimeRow) => {
    const ta = a.executionTimeMs ?? Infinity;
    const tb = b.executionTimeMs ?? Infinity;
    if (ta !== tb) return ta - tb;
    return (
      new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
    );
  });
  const rankings = withTime.map((r: WithTimeRow, index: number) => ({
    rank: index + 1,
    ...r,
  }));
  return NextResponse.json({ rankings, currentUserId: participantId });
}
