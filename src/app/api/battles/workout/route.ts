import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getWeekRange, minutesBetween } from "@/lib/week";

export async function GET() {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const [logs, users] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      select: { userId: true, startTime: true, endTime: true },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const userNames: Record<string, string> = {};
  users.forEach((u) => {
    userNames[u.id] = u.name ?? "이름 없음";
  });

  const byUser: Record<string, { sessionCount: number; totalMinutes: number }> = {};
  for (const log of logs) {
    if (!byUser[log.userId]) byUser[log.userId] = { sessionCount: 0, totalMinutes: 0 };
    byUser[log.userId].sessionCount += 1;
    if (log.startTime && log.endTime) {
      byUser[log.userId].totalMinutes += minutesBetween(log.startTime, log.endTime);
    }
  }

  const rankings = users
    .map((u) => ({
      userId: u.id,
      name: userNames[u.id],
      sessionCount: byUser[u.id]?.sessionCount ?? 0,
      totalMinutes: byUser[u.id]?.totalMinutes ?? 0,
    }))
    .sort((a, b) => {
      if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
      return b.totalMinutes - a.totalMinutes;
    });

  return NextResponse.json({
    weekStart,
    weekEnd,
    rankings,
    currentUserId: participantId,
  });
}
