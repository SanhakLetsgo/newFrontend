"use client";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length < totalCells) days.push(null);
  return days;
}

export function DashboardCalendar({
  workoutsByDate,
  papersByDate,
  year,
  month,
}: {
  workoutsByDate: Record<string, { count: number; types: string[] }>;
  papersByDate: Record<string, { count: number; titles: string[] }>;
  year: number;
  month: number;
}) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  const days = getCalendarDays(year, month);

  return (
    <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm p-5 shadow-lg shadow-black/10">
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-5 tracking-tight">
        {year}년 {month + 1}월
      </h2>
      <div className="overflow-x-auto -mx-1">
        <div className="grid grid-cols-7 gap-1 min-w-[280px]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
          {days.map((day, idx) => {
            const dateKey =
              day !== null
                ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;
            const workouts = dateKey ? workoutsByDate[dateKey] : null;
            const papers = dateKey ? papersByDate[dateKey] : null;
            const wCount = workouts?.count ?? 0;
            const pCount = papers?.count ?? 0;
            const isToday = isCurrentMonth && day === todayDate;
            const hasActivity = wCount > 0 || pCount > 0;

            return (
              <div
                key={idx}
                className={`min-h-[5rem] rounded-xl p-2 flex flex-col items-center justify-start transition-colors ${
                  day === null
                    ? "invisible"
                    : isToday
                      ? "bg-[hsl(var(--accent))] text-white shadow-md shadow-[hsl(var(--accent))]/30"
                      : hasActivity
                        ? "bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))]"
                        : "bg-[hsl(var(--muted))]/30 hover:bg-[hsl(var(--muted))]/50"
                }`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`text-sm font-semibold mb-1.5 ${
                        isToday ? "text-white" : "text-[hsl(var(--foreground))]"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex flex-col gap-1.5 w-full min-w-0">
                      {wCount > 0 && (
                        <div
                          className={`rounded-lg px-2 py-1 text-[10px] font-medium truncate text-center border ${
                            isToday
                              ? "bg-white/25 text-white border-white/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-sm"
                          }`}
                          title={workouts?.types?.join(", ")}
                        >
                          운동 {wCount}회
                        </div>
                      )}
                      {pCount > 0 && (
                        <div
                          className={`rounded-lg px-2 py-1 text-[10px] font-medium truncate text-center border ${
                            isToday
                              ? "bg-white/25 text-white border-white/40"
                              : "bg-violet-500/20 text-violet-300 border-violet-400/30 shadow-sm"
                          }`}
                          title={papers?.titles?.join(", ")}
                        >
                          논문 {pCount}개
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
