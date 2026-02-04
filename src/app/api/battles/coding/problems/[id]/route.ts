import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

type ProblemDetailRow = {
  id: string;
  title: string;
  description: string;
  referenceCode: string | null;
  referenceLanguage: string | null;
  weekStart: string;
  userId: string;
  createdAt: Date;
  user: { name: string | null } | null;
};

type SubmissionDetailRow = {
  id: string;
  code: string;
  language: string;
  startedAt: Date | null;
  completedAt: Date | null;
  executionTimeMs: number | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;
  const problem = (await prisma.codingBattleProblem.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })) as ProblemDetailRow | null;
  if (!problem) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
  }
  const mySubmission = (await prisma.codingBattleSubmission.findUnique({
    where: { problemId_userId: { problemId: id, userId: participantId } },
  })) as SubmissionDetailRow | null;
  return NextResponse.json({
    id: problem.id,
    title: problem.title,
    description: problem.description,
    referenceCode: problem.referenceCode ?? null,
    referenceLanguage: problem.referenceLanguage ?? "javascript",
    weekStart: problem.weekStart,
    userId: problem.userId,
    creatorName: problem.user?.name ?? "이름 없음",
    createdAt: problem.createdAt,
    mySubmission: mySubmission
      ? {
          id: mySubmission.id,
          code: mySubmission.code,
          language: mySubmission.language,
          startedAt: mySubmission.startedAt,
          completedAt: mySubmission.completedAt,
          executionTimeMs: mySubmission.executionTimeMs ?? undefined,
        }
      : null,
  });
}
