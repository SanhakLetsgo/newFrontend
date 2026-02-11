import { NextResponse } from "next/server";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getMondayOfWeek, getSundayOfWeek, toLocalDateString } from "@/lib/week";

export async function GET(req: Request) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const weeksCount = Math.min(24, Math.max(1, Number(searchParams.get("weeks")) || 12));
  const todayStr = toLocalDateString(new Date());

  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true },
    });
    const userById = new Map(allUsers.map((u) => [u.id, u]));

    // 이번 주(월요일)부터 시작해서, 이미 끝난 주만 이전 현황에 포함
    const thisWeekMonday = getMondayOfWeek(new Date());
    const weekStarts: string[] = [];
    let d = new Date(thisWeekMonday + "T12:00:00");
    for (let i = 0; i < weeksCount; i++) {
      const weekStart = toLocalDateString(d);
      const weekEnd = getSundayOfWeek(weekStart);
      if (weekEnd < todayStr) {
        weekStarts.push(weekStart);
      }
      d.setDate(d.getDate() + 7);
    }
    weekStarts.reverse(); // 가장 최근에 끝난 주가 먼저 보이도록

    const weeks: {
      weekStart: string;
      weekEnd: string;
      participants: { userId: string; name: string; count: number; calories: number; rank: number }[];
    }[] = [];

    for (const weekStart of weekStarts) {
      const weekEnd = getSundayOfWeek(weekStart);
      const logs = await prisma.workoutLog.findMany({
        where: { date: { gte: weekStart, lte: weekEnd } },
      });
      const countByUser: Record<string, number> = {};
      const caloriesByUser: Record<string, number> = {};
      for (const log of logs) {
        countByUser[log.userId] = (countByUser[log.userId] ?? 0) + 1;
        const cal = (log as { calories?: number | null }).calories ?? 0;
        caloriesByUser[log.userId] = (caloriesByUser[log.userId] ?? 0) + cal;
      }
      const userIds = Array.from(new Set([...Object.keys(countByUser), ...allUsers.map((u) => u.id)]));
      const participants = userIds
        .map((userId) => ({
          userId,
          name: userById.get(userId)?.name ?? "이름 없음",
          count: countByUser[userId] ?? 0,
          calories: caloriesByUser[userId] ?? 0,
        }))
        // 등수는 소모 칼로리 기준 (동점이면 참여횟수)
        .sort((a, b) => (b.calories - a.calories) || (b.count - a.count))
        .map((p, i) => ({ ...p, rank: i + 1 }));

      weeks.push({ weekStart, weekEnd, participants });
    }

    return NextResponse.json({ weeks });
  } catch (e) {
    console.error("workouts history error:", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
