import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let workoutsByDate: Record<string, { count: number; types: string[] }> = {};
  let papersByDate: Record<string, { count: number; titles: string[] }> = {};

  if (participantId) {
    const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
    type WorkoutRow = { date: string; workoutType: string | null };
    const [monthWorkoutsRaw, monthPapers] = await Promise.all([
      prisma.workoutLog.findMany({
        where: { userId: participantId, date: { gte: monthStart, lte: monthEnd } },
        select: { date: true, workoutType: true } as { date: boolean; workoutType: boolean },
      }),
      prisma.paper.findMany({
        where: { userId: participantId, readAt: { gte: monthStart, lte: monthEnd } },
        select: { readAt: true, title: true },
      }),
    ]);
    const monthWorkouts = monthWorkoutsRaw as unknown as WorkoutRow[];

    for (const w of monthWorkouts) {
      if (!workoutsByDate[w.date]) workoutsByDate[w.date] = { count: 0, types: [] };
      workoutsByDate[w.date].count += 1;
      if (w.workoutType?.trim()) workoutsByDate[w.date].types.push(w.workoutType.trim());
    }
    for (const p of monthPapers) {
      const d = p.readAt;
      if (!papersByDate[d]) papersByDate[d] = { count: 0, titles: [] };
      papersByDate[d].count += 1;
      papersByDate[d].titles.push(p.title);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-semibold sr-only">대시보드</h1>
      {!participantId && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-6 text-center">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            로그인하거나 회원가입하면 운동·논문·창고리즘 기록을 쌓을 수 있어요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[hsl(var(--border))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
            >
              회원가입
            </Link>
          </div>
        </div>
      )}
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
