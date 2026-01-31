"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkoutLog = {
  id: string;
  date: string;
  attended: boolean;
  startTime: string | null;
  endTime: string | null;
};

export function DashboardCards({
  todaySessions,
  weekPapersCount,
}: {
  todaySessions: WorkoutLog[];
  weekPapersCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attended = todaySessions[0]?.attended ?? false;
  const activeSession = todaySessions.find((s) => s.startTime && !s.endTime);
  const displayStart = activeSession?.startTime ?? todaySessions[0]?.startTime ?? "—";
  const displayEnd = activeSession ? "진행 중" : (todaySessions[0]?.endTime ?? "—");
  const hasActiveSession = todaySessions.some((s) => s.startTime && !s.endTime);

  const fetchOpts = {
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    credentials: "include" as const,
  };

  const toggleAttendance = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/workouts/attendance", {
        ...fetchOpts,
        body: JSON.stringify({ attended: !attended }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "저장 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  const startWorkout = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/workouts/start", {
        ...fetchOpts,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "저장 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  const endWorkout = async () => {
    if (!hasActiveSession) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/workouts/end", {
        ...fetchOpts,
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "저장 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 오늘 운동 카드 */}
        <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-3">오늘 운동</h2>
          <dl className="space-y-1 text-sm text-[hsl(var(--muted-foreground))] mb-4">
            <div className="flex justify-between">
              <dt>출석</dt>
              <dd>{attended ? "체크됨" : "미체크"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>오늘 회차</dt>
              <dd>{todaySessions.length}회</dd>
            </div>
            <div className="flex justify-between">
              <dt>시작 시간</dt>
              <dd>{displayStart}</dd>
            </div>
            <div className="flex justify-between">
              <dt>종료 시간</dt>
              <dd>{displayEnd}</dd>
            </div>
          </dl>
          {error && (
            <p className="text-sm text-red-400 mb-2" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleAttendance}
              disabled={busy}
              className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            >
              {attended ? "출석 취소" : "출석 체크"}
            </button>
            <button
              type="button"
              onClick={startWorkout}
              disabled={busy}
              className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            >
              운동 시작
            </button>
            <button
              type="button"
              onClick={endWorkout}
              disabled={busy || !hasActiveSession}
              className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            >
              운동 종료
            </button>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            운동 시작/종료를 누르면 새 기록이 추가됩니다. (덮어쓰지 않음)
          </p>
        </section>

        {/* 논문 스터디 카드 */}
        <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-3">논문 스터디</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            이번 주 내가 읽은 논문 <strong className="text-[hsl(var(--foreground))]">{weekPapersCount}</strong>개
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/papers"
              className="inline-flex rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--muted))]"
            >
              내 논문 보기
            </Link>
            <Link
              href="/papers?add=1"
              className="inline-flex rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-sm font-medium hover:opacity-90"
            >
              논문 추가 + 리뷰 작성
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
