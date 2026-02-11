import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getWeekRange } from "@/lib/week";
import { WorkoutsView } from "./WorkoutsView";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function WorkoutsPage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");
  const today = todayStr();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const fromStr = from.toISOString().slice(0, 10);

  let todayLogs: Awaited<ReturnType<typeof prisma.workoutLog.findMany>>;
  let allLogsRaw: Awaited<ReturnType<typeof prisma.workoutLog.findMany>>;
  let allUsers: { id: string; name: string | null }[];
  let weekLogsRawFull: Awaited<ReturnType<typeof prisma.workoutLog.findMany>>;
  let weekLogs: { userId: string; calories: number | null }[];

  try {
    const [todayLogsResult, allLogsResult, allUsersResult, weekLogsRaw] = await Promise.all([
      prisma.workoutLog.findMany({ where: { userId: participantId, date: today } }),
      prisma.workoutLog.findMany({
        where: { date: { gte: fromStr, lte: today } },
      }),
      prisma.user.findMany({ select: { id: true, name: true } }),
      prisma.workoutLog.findMany({
        where: { date: { gte: weekStart, lte: weekEnd } },
      }),
    ]);
    todayLogs = todayLogsResult;
    allLogsRaw = allLogsResult;
    allUsers = allUsersResult;
    weekLogsRawFull = weekLogsRaw;
    weekLogs = weekLogsRaw.map((l) => ({
      userId: l.userId,
      calories: (l as { calories?: number | null }).calories ?? null,
    }));
  } catch (e) {
    console.error("Workouts page data fetch error:", e);
    return (
      <div className="space-y-8">
        <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">운동</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          운동 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      </div>
    );
  }

  const userById = new Map(allUsers.map((u) => [u.id, u]));
  const allLogs = allLogsRaw.map((log) => ({
    ...log,
    createdAt: log.createdAt ? log.createdAt.toISOString() : null,
    user: { name: userById.get(log.userId)?.name ?? null },
  }));

  const weekCountByUser: Record<string, number> = {};
  const weekCaloriesByUser: Record<string, number> = {};
  for (const w of weekLogs) {
    weekCountByUser[w.userId] = (weekCountByUser[w.userId] ?? 0) + 1;
    const c = w.calories ?? 0;
    weekCaloriesByUser[w.userId] = (weekCaloriesByUser[w.userId] ?? 0) + c;
  }

  // 주간 출석: 운동을 1건 이상 기록한 날을 출석으로 인정 (날짜별 중복 제거)
  const weekAttendanceDatesByUser: Record<string, Set<string>> = {};
  for (const log of weekLogsRawFull) {
    if (!weekAttendanceDatesByUser[log.userId]) weekAttendanceDatesByUser[log.userId] = new Set();
    weekAttendanceDatesByUser[log.userId].add(log.date);
  }
  const weekAttendanceDaysByUser: Record<string, number> = {};
  for (const u of allUsers) {
    weekAttendanceDaysByUser[u.id] = weekAttendanceDatesByUser[u.id]?.size ?? 0;
  }

  // 동점 시 순서: 먼저 기록한 사람이 위에 (이번 주 내 최초 기록 시각 기준)
  const firstRecordedAtByUser: Record<string, number> = {};
  for (const log of weekLogsRawFull) {
    const t = log.createdAt ? new Date(log.createdAt).getTime() : Number.POSITIVE_INFINITY;
    if (firstRecordedAtByUser[log.userId] == null || firstRecordedAtByUser[log.userId] > t) {
      firstRecordedAtByUser[log.userId] = t;
    }
  }

  type StatRow = { userId: string; name: string; weekCount: number; weekCalories: number; rank: number };
  const statsSorted = allUsers
    .map((u) => ({
      userId: u.id,
      name: u.name ?? "이름 없음",
      weekCount: weekCountByUser[u.id] ?? 0,
      weekCalories: weekCaloriesByUser[u.id] ?? 0,
    }))
    .sort(
      (a, b) =>
        b.weekCalories - a.weekCalories ||
        (firstRecordedAtByUser[a.userId] ?? Number.POSITIVE_INFINITY) - (firstRecordedAtByUser[b.userId] ?? Number.POSITIVE_INFINITY)
    );
  let prevCal = -1;
  let denseRank = 0;
  const allParticipantsStats: StatRow[] = statsSorted.map((p) => {
    if (p.weekCalories !== prevCal) {
      prevCal = p.weekCalories;
      denseRank += 1;
    }
    return { ...p, rank: denseRank };
  });

  type AttendanceRow = { userId: string; name: string; weekAttendanceDays: number; rank: number };
  const attendanceSorted = allUsers
    .map((u) => ({
      userId: u.id,
      name: u.name ?? "이름 없음",
      weekAttendanceDays: weekAttendanceDaysByUser[u.id] ?? 0,
    }))
    .sort(
      (a, b) =>
        b.weekAttendanceDays - a.weekAttendanceDays ||
        (firstRecordedAtByUser[a.userId] ?? Number.POSITIVE_INFINITY) - (firstRecordedAtByUser[b.userId] ?? Number.POSITIVE_INFINITY)
    );
  let prevDays = -1;
  let attendanceDenseRank = 0;
  const allParticipantsAttendance: AttendanceRow[] = attendanceSorted.map((p) => {
    if (p.weekAttendanceDays !== prevDays) {
      prevDays = p.weekAttendanceDays;
      attendanceDenseRank += 1;
    }
    return { ...p, rank: attendanceDenseRank };
  });

  const todayTotalCalories = todayLogs.reduce((sum, s) => sum + ((s as { calories?: number | null }).calories ?? 0), 0);

  const todaySessions = todayLogs
    .sort(
      (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    )
    .map((s) => ({
      ...s,
      createdAt: s.createdAt ? s.createdAt.toISOString() : null,
    }));
  const logs = allLogs.sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  );

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 min-w-0 overflow-x-hidden pb-safe">
      <h1 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))] px-0">운동</h1>
      <WorkoutsView
        currentParticipantId={participantId}
        todaySessions={todaySessions}
        todayTotalCalories={todayTotalCalories}
        logs={logs}
        weekStart={weekStart}
        weekEnd={weekEnd}
        allParticipantsStats={allParticipantsStats}
        allParticipantsAttendance={allParticipantsAttendance}
      />
    </div>
  );
}
