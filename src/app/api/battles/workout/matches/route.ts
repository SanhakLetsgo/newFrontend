import { NextRequest, NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";

type WorkoutBattleRow = {
  id: string;
  userId: string;
  sport: string;
  participantA: string;
  participantB: string;
  result: string;
  createdAt: Date;
};

export async function GET() {
  const userId = await getParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const list = (await prisma.workoutBattle.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })) as unknown as WorkoutBattleRow[];
  const userIds: string[] = [...new Set(list.map((b: WorkoutBattleRow) => b.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const nameMap: Record<string, string> = {};
  users.forEach((u) => {
    nameMap[u.id] = u.name ?? "이름 없음";
  });
  return NextResponse.json({
    matches: list.map((m: WorkoutBattleRow) => ({
      id: m.id,
      sport: m.sport,
      participantA: m.participantA,
      participantB: m.participantB,
      result: m.result,
      createdAt: m.createdAt.toISOString(),
      recordedByName: nameMap[m.userId] ?? "이름 없음",
    })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getParticipantId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  let body: { sport?: string; participantA?: string; participantB?: string; result?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const sport = typeof body.sport === "string" ? body.sport.trim() : "";
  const participantA = typeof body.participantA === "string" ? body.participantA.trim() : "";
  const participantB = typeof body.participantB === "string" ? body.participantB.trim() : "";
  const result = typeof body.result === "string" ? body.result.trim() : "";
  if (!sport || !participantA || !participantB || !result) {
    return NextResponse.json(
      { error: "종목, 대전자 둘, 결과를 모두 입력해 주세요." },
      { status: 400 }
    );
  }
  const match = (await prisma.workoutBattle.create({
    data: {
      userId,
      sport,
      participantA,
      participantB,
      result,
    },
  })) as unknown as WorkoutBattleRow;
  return NextResponse.json({
    id: match.id,
    sport: match.sport,
    participantA: match.participantA,
    participantB: match.participantB,
    result: match.result,
    createdAt: match.createdAt.toISOString(),
  });
}
