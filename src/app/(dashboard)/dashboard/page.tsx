import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { DashboardEntryCards } from "./DashboardEntryCards";
import { DashboardCalendar } from "./DashboardCalendar";

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const participantId = await getParticipantId();
  if (!participantId) return null;
  const userId = participantId;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const { start: monthStart, end: monthEnd } = getMonthRange(year, month);

  const [monthWorkouts, monthPapers] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      select: { date: true, workoutType: true },
    }),
    prisma.paper.findMany({
      where: { userId, readAt: { gte: monthStart, lte: monthEnd } },
      select: { readAt: true, title: true },
    }),
  ]);

  const workoutsByDate: Record<string, { count: number; types: string[] }> = {};
  for (const w of monthWorkouts) {
    if (!workoutsByDate[w.date]) workoutsByDate[w.date] = { count: 0, types: [] };
    workoutsByDate[w.date].count += 1;
    if (w.workoutType?.trim()) workoutsByDate[w.date].types.push(w.workoutType.trim());
  }

  const papersByDate: Record<string, { count: number; titles: string[] }> = {};
  for (const p of monthPapers) {
    const d = p.readAt;
    if (!papersByDate[d]) papersByDate[d] = { count: 0, titles: [] };
    papersByDate[d].count += 1;
    papersByDate[d].titles.push(p.title);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold sr-only">대시보드</h1>
      <DashboardEntryCards />
      <DashboardCalendar
        year={year}
        month={month}
        workoutsByDate={workoutsByDate}
        papersByDate={papersByDate}
      />
    </div>
  );
}
