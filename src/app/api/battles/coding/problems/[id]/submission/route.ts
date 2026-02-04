import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { runCppTests } from "@/lib/runCode";

type SubmissionRow = {
  id: string;
  code: string;
  language: string;
  startedAt: Date | null;
  completedAt: Date | null;
  executionTimeMs?: number | null;
};

type ProblemRow = {
  testCases: unknown;
  completedAt?: Date | null;
  code?: string;
};

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
  let submission = (await prisma.codingBattleSubmission.findUnique({
    where: { problemId_userId: { problemId, userId: participantId } },
  })) as SubmissionRow | null;
  if (!submission) {
    submission = (await prisma.codingBattleSubmission.create({
      data: {
        problemId,
        userId: participantId,
        code: "",
        language: "cpp",
        startedAt: new Date(),
      },
    })) as unknown as SubmissionRow;
  }
  return NextResponse.json({
    id: submission.id,
    code: submission.code,
    language: submission.language,
    startedAt: submission.startedAt,
    completedAt: submission.completedAt,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id: problemId } = await params;
  const problem = (await prisma.codingBattleProblem.findUnique({
    where: { id: problemId },
  })) as ProblemRow | null;
  if (!problem) {
    return NextResponse.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
  }
  try {
    const body = await req.json();
    const code = typeof body.code === "string" ? body.code : undefined;
    const language = typeof body.language === "string" ? body.language : undefined;
    const complete = body.complete === true;

    let submission = (await prisma.codingBattleSubmission.findUnique({
      where: { problemId_userId: { problemId, userId: participantId } },
    })) as SubmissionRow | null;

    let executionTimeMs: number | null = null;
    if (complete && !submission?.completedAt) {
      const testCasesRaw = problem.testCases;
      const testCases = Array.isArray(testCasesRaw)
        ? (testCasesRaw as { input: string; expectedOutput: string }[]).filter(
            (tc) => typeof tc.input === "string" && typeof tc.expectedOutput === "string"
          )
        : [];
      const codeToRun = (code ?? submission?.code ?? "").trim();
      if (!codeToRun) {
        return NextResponse.json({ error: "코드를 입력한 뒤 제출하세요." }, { status: 400 });
      }
      const lang = (language ?? "").toLowerCase();
      if (lang !== "cpp" && lang !== "c++" && lang !== "c") {
        return NextResponse.json(
          { error: "테스트 검증은 C++로 진행됩니다. C++로 작성해 주세요." },
          { status: 400 }
        );
      }
      const runResult = runCppTests(codeToRun, testCases);
      if (!runResult.passed) {
        return NextResponse.json(
          {
            error: `테스트 실패 (${runResult.failedIndex}번째 케이스): ${runResult.message}`,
            failedIndex: runResult.failedIndex,
            runMessage: runResult.message,
          },
          { status: 400 }
        );
      }
      executionTimeMs = runResult.executionTimeMs;
    }

    if (!submission) {
      submission = (await prisma.codingBattleSubmission.create({
        data: {
          problemId,
          userId: participantId,
          code: code ?? "",
          language: language ?? "cpp",
          startedAt: new Date(),
          completedAt: complete ? new Date() : null,
          executionTimeMs: executionTimeMs ?? undefined,
        },
      })) as unknown as SubmissionRow;
    } else {
      const updateData: {
        code?: string;
        language?: string;
        completedAt?: Date | null;
        executionTimeMs?: number | null;
      } = {};
      if (code !== undefined) updateData.code = code;
      if (language !== undefined) updateData.language = language;
      if (complete && !submission.completedAt) {
        updateData.completedAt = new Date();
        if (executionTimeMs != null) updateData.executionTimeMs = executionTimeMs;
      }
      submission = (await prisma.codingBattleSubmission.update({
        where: { id: submission.id },
        data: updateData,
      })) as unknown as SubmissionRow;
    }
    return NextResponse.json({
      id: submission.id,
      code: submission.code,
      language: submission.language,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      executionTimeMs: submission.executionTimeMs ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
