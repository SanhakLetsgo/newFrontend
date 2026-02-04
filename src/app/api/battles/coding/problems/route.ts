import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getWeekRange } from "@/lib/week";

type ProblemRow = {
  id: string;
  title: string;
  description: string;
  referenceCode: string | null;
  referenceLanguage: string | null;
  testCases: unknown;
  weekStart: string;
  userId: string;
  createdAt: Date;
  user: { name: string | null } | null;
};

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { start: weekStart } = getWeekRange();
  const problems = (await prisma.codingBattleProblem.findMany({
    where: { weekStart },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })) as unknown as ProblemRow[];
  return NextResponse.json(
    problems.map((p: ProblemRow) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      referenceCode: p.referenceCode ?? null,
      referenceLanguage: p.referenceLanguage ?? "javascript",
      testCases: p.testCases ?? [],
      weekStart: p.weekStart,
      userId: p.userId,
      creatorName: p.user?.name ?? "이름 없음",
      createdAt: p.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const referenceCode = typeof body.referenceCode === "string" ? body.referenceCode : null;
    const referenceLanguage =
      typeof body.referenceLanguage === "string" && body.referenceLanguage.trim()
        ? body.referenceLanguage.trim()
        : "javascript";
    const rawTestCases = Array.isArray(body.testCases) ? body.testCases : [];
    const testCases = rawTestCases
      .filter(
        (tc: unknown) =>
          tc &&
          typeof tc === "object" &&
          "input" in tc &&
          "expectedOutput" in tc &&
          typeof (tc as { input: unknown }).input === "string" &&
          typeof (tc as { expectedOutput: unknown }).expectedOutput === "string"
      )
      .map((tc: { input: string; expectedOutput: string }) => ({
        input: String(tc.input),
        expectedOutput: String(tc.expectedOutput),
      }));
    if (!title) {
      return NextResponse.json({ error: "제목을 입력하세요." }, { status: 400 });
    }
    const { start: weekStart } = getWeekRange();
    const problem = (await prisma.codingBattleProblem.create({
      data: {
        title,
        description: description || "",
        referenceCode: referenceCode || null,
        referenceLanguage: referenceLanguage || "javascript",
        testCases: testCases.length > 0 ? testCases : undefined,
        weekStart,
        userId: participantId,
      },
      include: { user: { select: { name: true } } },
    })) as unknown as ProblemRow & { user: { name: string | null } | null };
    return NextResponse.json({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      referenceCode: problem.referenceCode,
      referenceLanguage: problem.referenceLanguage,
      testCases: problem.testCases ?? [],
      weekStart: problem.weekStart,
      userId: problem.userId,
      creatorName: problem.user?.name ?? "이름 없음",
      createdAt: problem.createdAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "문제 추가 실패" }, { status: 500 });
  }
}
