import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { WorkoutsView } from "./WorkoutsView";

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

export default async function WorkoutsPage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");
  const today = todayStr();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const fromStr = from.toISOString().slice(0, 10);

  const [todayLogs, allLogs, allUsers, weekLogs] = await Promise.all([
    prisma.workoutLog.findMany({ where: { userId: participantId, date: today } }),
    prisma.workoutLog.findMany({
      where: { date: { gte: fromStr, lte: today } },
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.workoutLog.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      select: { userId: true },
    }),
  ]);

  const weekCountByUser: Record<string, number> = {};
  for (const w of weekLogs) {
    weekCountByUser[w.userId] = (weekCountByUser[w.userId] ?? 0) + 1;
  }

  const allParticipantsStats = allUsers.map((u) => ({
    userId: u.id,
    name: u.name ?? "이름 없음",
    weekCount: weekCountByUser[u.id] ?? 0,
  })).sort((a, b) => b.weekCount - a.weekCount);

  const todaySessions = todayLogs.sort(
    (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
  const logs = allLogs.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">운동</h1>
      <WorkoutsView
        currentParticipantId={participantId}
        todaySessions={todaySessions}
        logs={logs}
        allParticipantsStats={allParticipantsStats}
      />
    </div>
  );
}
