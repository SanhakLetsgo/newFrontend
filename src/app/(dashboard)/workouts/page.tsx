import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { WorkoutsView } from "./WorkoutsView";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function WorkoutsPage() {
  const participantId = await getParticipantId();
  if (!participantId) return null;
  const today = todayStr();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const fromStr = from.toISOString().slice(0, 10);
  const [todayLogs, allLogs] = await Promise.all([
    prisma.workoutLog.findMany({ where: { userId: participantId, date: today } }),
    prisma.workoutLog.findMany({
      where: { date: { gte: fromStr, lte: today } },
      include: { user: { select: { name: true } } },
    }),
  ]);
  const todaySessions = todayLogs.sort(
    (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
  const logs = allLogs.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">운동 기록 (모든 참여자)</h1>
      <WorkoutsView
        currentParticipantId={participantId}
        todaySessions={todaySessions}
        logs={logs}
      />
    </div>
  );
}
