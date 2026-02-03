"use client";

function calcDurationMin(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const m = (eh * 60 + em) - (sh * 60 + sm);
  return m < 0 ? 0 : m;
}

function calcDurationStr(start: string | null, end: string | null): string {
  const m = calcDurationMin(start, end);
  if (m === 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return `${h}시간 ${min}분`;
  return `${min}분`;
}

function formatDetails(d: unknown): string {
  if (d == null || typeof d !== "object" || Array.isArray(d)) return "—";
  const parts = Object.entries(d as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(", ") : "—";
}

function getLast7Days(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

function getWeekRange(): { start: string; end: string } {
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

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type Log = {
  id: string;
  userId: string;
  date: string;
  attended: boolean;
  startTime: string | null;
  endTime: string | null;
  workoutType?: string | null;
  details?: unknown;
};

export function WorkoutStatsPanel({
  session,
  myLogs,
  todayCount,
  onClose,
  onEdit,
}: {
  session: Log;
  myLogs: Log[];
  todayCount: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const last7 = getLast7Days();
  const { start: weekStart, end: weekEnd } = getWeekRange();
  const weekLogs = myLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd);
  const weekCount = weekLogs.length;
  const countByDay = last7.map((d) => myLogs.filter((l) => l.date === d).length);
  const maxCount = Math.max(1, ...countByDay);
  const byType: Record<string, number> = {};
  for (const l of weekLogs) {
    const t = l.workoutType?.trim() || "기타";
    byType[t] = (byType[t] ?? 0) + 1;
  }
  const targetPerType = 5;

  const weekTotalMinutes = weekLogs.reduce((acc, l) => acc + calcDurationMin(l.startTime, l.endTime), 0);
  const totalHours = Math.floor(weekTotalMinutes / 60);
  const totalMins = weekTotalMinutes % 60;
  const totalTimeStr = totalHours > 0 ? `${totalHours}시간 ${totalMins}분` : `${totalMins}분`;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <div className="p-4 sm:p-5 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">운동 통계</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              수정
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[hsl(var(--muted))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))]/80"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
          {/* 선택한 세션 요약 */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">이번 세션</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-[hsl(var(--muted-foreground))]">날짜</dt>
              <dd>{session.date}</dd>
              <dt className="text-[hsl(var(--muted-foreground))]">종목</dt>
              <dd>{session.workoutType ?? "—"}</dd>
              <dt className="text-[hsl(var(--muted-foreground))]">시간</dt>
              <dd>{session.startTime ?? "—"} ~ {session.endTime ?? "—"}</dd>
              <dt className="text-[hsl(var(--muted-foreground))]">총 시간</dt>
              <dd>{calcDurationStr(session.startTime, session.endTime)}</dd>
              {formatDetails(session.details) !== "—" && (
                <>
                  <dt className="text-[hsl(var(--muted-foreground))]">상세</dt>
                  <dd className="truncate" title={formatDetails(session.details)}>{formatDetails(session.details)}</dd>
                </>
              )}
            </dl>
          </div>

          {/* 주간 활동 차트 */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-4">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">주간 활동</h3>
            <div className="flex items-end justify-between gap-1 h-32">
              {last7.map((d, i) => {
                const count = countByDay[i];
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const dayLabel = WEEKDAY_LABELS[new Date(d).getDay()];
                return (
                  <div key={d} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[hsl(var(--accent))]/60 min-h-[4px] transition-all"
                      style={{ height: `${Math.max(8, pct)}%` }}
                      title={`${d} ${count}회`}
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/10 p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">이번 주</p>
              <p className="text-2xl font-bold text-[hsl(var(--accent))]">{weekCount}회</p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">오늘</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{todayCount}회</p>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">이번 주 총 시간</p>
              <p className="text-xl font-bold text-[hsl(var(--foreground))]">{totalTimeStr}</p>
            </div>
          </div>

          {/* 종목별 진행 */}
          {Object.keys(byType).length > 0 && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">이번 주 종목별</h3>
              <ul className="space-y-3">
                {Object.entries(byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = Math.min(100, (count / targetPerType) * 100);
                    return (
                      <li key={type} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-[hsl(var(--foreground))]">{type}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">{count}회 / 목표 {targetPerType}회</span>
                        </div>
                        <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[hsl(var(--accent))] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
