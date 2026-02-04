import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getWeekRange } from "@/lib/week";

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { start: weekStart, end: weekEnd } = getWeekRange();
  type ProblemRow = { id: string; title: string };
  const problems = (await prisma.codingBattleProblem.findMany({
    where: { weekStart },
    orderBy: { createdAt: "asc" },
  })) as unknown as ProblemRow[];
  const problemIds = problems.map((p: ProblemRow) => p.id);
  type SubmissionRow = {
    problemId: string;
    userId: string;
    executionTimeMs: number | null;
    completedAt: Date | null;
    user: { name: string | null } | null;
  };
  const submissions = (await prisma.codingBattleSubmission.findMany({
    where: {
      problemId: { in: problemIds },
      completedAt: { not: null },
    },
    include: { user: { select: { id: true, name: true } } },
  })) as unknown as SubmissionRow[];
  const byProblem: Record<
    string,
    { userId: string; name: string; executionTimeMs: number | null; completedAt: Date }[]
  > = {};
  for (const s of submissions) {
    if (!byProblem[s.problemId]) byProblem[s.problemId] = [];
    byProblem[s.problemId].push({
      userId: s.userId,
      name: s.user?.name ?? "이름 없음",
      executionTimeMs: s.executionTimeMs ?? null,
      completedAt: s.completedAt!,
    });
  }
  for (const id of problemIds) {
    const list = byProblem[id] ?? [];
    list.sort((a, b) => {
      const ta = a.executionTimeMs ?? Infinity;
      const tb = b.executionTimeMs ?? Infinity;
      if (ta !== tb) return ta - tb;
      return a.completedAt.getTime() - b.completedAt.getTime();
    });
    byProblem[id] = list;
  }
  const problemsWithRankings = problems.map((p: ProblemRow) => ({
    id: p.id,
    title: p.title,
    rankings: (byProblem[p.id] ?? []).map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name,
      timeSeconds: r.executionTimeMs != null ? r.executionTimeMs / 1000 : null,
    })),
  }));
  return NextResponse.json({
    weekStart,
    weekEnd,
    problems: problemsWithRankings,
    currentUserId: participantId,
  });
}
