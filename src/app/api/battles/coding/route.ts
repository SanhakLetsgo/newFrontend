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
  const weekStartDate = new Date(weekStart + "T00:00:00.000Z");
  const weekEndDate = new Date(weekEnd + "T23:59:59.999Z");

  const [codePosts, notes, users] = await Promise.all([
    prisma.psCodePost.findMany({
      where: {
        createdAt: { gte: weekStartDate, lte: weekEndDate },
      },
      select: { userId: true },
    }),
    prisma.psNote.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      select: { userId: true },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
    }),
  ]);

  type UserRow = { id: string; name: string | null };
  type RowWithUserId = { userId: string };
  const userNames: Record<string, string> = {};
  (users as UserRow[]).forEach((u: UserRow) => {
    userNames[u.id] = u.name ?? "이름 없음";
  });

  const byUser: Record<string, { codePostCount: number; noteCount: number }> = {};
  for (const p of codePosts as RowWithUserId[]) {
    if (!byUser[p.userId]) byUser[p.userId] = { codePostCount: 0, noteCount: 0 };
    byUser[p.userId].codePostCount += 1;
  }
  for (const n of notes as RowWithUserId[]) {
    if (!byUser[n.userId]) byUser[n.userId] = { codePostCount: 0, noteCount: 0 };
    byUser[n.userId].noteCount += 1;
  }

  type RankingItem = { userId: string; name: string; codePostCount: number; noteCount: number; total: number };
  const rankings: RankingItem[] = (users as UserRow[])
    .map((u: UserRow) => ({
      userId: u.id,
      name: userNames[u.id],
      codePostCount: byUser[u.id]?.codePostCount ?? 0,
      noteCount: byUser[u.id]?.noteCount ?? 0,
      total: (byUser[u.id]?.codePostCount ?? 0) + (byUser[u.id]?.noteCount ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    weekStart,
    weekEnd,
    rankings,
    currentUserId: participantId,
  });
}
