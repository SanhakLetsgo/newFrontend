import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { DashboardCards } from "./DashboardCards";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const participantId = await getParticipantId();
  if (!participantId) return null;
  const userId = participantId;
  const today = todayStr();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const todayLogs = await prisma.workoutLog.findMany({
    where: { userId, date: today },
  });
  const todaySessions = todayLogs.sort(
    (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
  const weekPapersCount = await prisma.paper.count({
    where: {
      userId,
      readAt: { gte: weekStart, lte: weekEnd },
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold sr-only">대시보드</h1>
      <DashboardCards
        todaySessions={todaySessions}
        weekPapersCount={weekPapersCount}
      />
    </div>
  );
}
