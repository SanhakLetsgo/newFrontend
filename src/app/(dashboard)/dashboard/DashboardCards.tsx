"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function getClientDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getClientTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type WorkoutLog = {
  id: string;
  date: string;
  attended: boolean;
  startTime: string | null;
  endTime: string | null;
  workoutType?: string | null;
  details?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
};

const TREADMILL_TYPES = ["러닝머신", "러닝", "러닝 머신"];

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
  const [workoutType, setWorkoutType] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [treadmillMinutes, setTreadmillMinutes] = useState("");
  const [treadmillCalories, setTreadmillCalories] = useState("");
  const [treadmillDistance, setTreadmillDistance] = useState("");
  const [customDetails, setCustomDetails] = useState<{ key: string; value: string }[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualDate, setManualDate] = useState(getClientDate());
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualType, setManualType] = useState("");
  const [manualTreadmillM, setManualTreadmillM] = useState("");
  const [manualTreadmillC, setManualTreadmillC] = useState("");
  const [manualTreadmillD, setManualTreadmillD] = useState("");
  const [manualCustomDetails, setManualCustomDetails] = useState<{ key: string; value: string }[]>([]);

  const attended = todaySessions[0]?.attended ?? false;
  const activeSession = todaySessions.find((s) => s.startTime && !s.endTime);
  const displayStart = activeSession?.startTime ?? todaySessions[0]?.startTime ?? "—";
  const displayEnd = activeSession ? "진행 중" : (todaySessions[0]?.endTime ?? "—");
  const hasActiveSession = todaySessions.some((s) => s.startTime && !s.endTime);

  useEffect(() => {
    if (!activeSession?.createdAt) {
      setElapsed(0);
      return;
    }
    const startMs = new Date(activeSession.createdAt).getTime();
    const tick = () => setElapsed(Date.now() - startMs);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession?.id, activeSession?.createdAt]);

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
        body: JSON.stringify({
          date: getClientDate(),
          startTime: getClientTime(),
          workoutType: workoutType.trim() || undefined,
        }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : data.error?.message ?? "저장 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  const buildDetails = (): Record<string, string | number> | undefined => {
    const isTreadmill = TREADMILL_TYPES.some((t) => workoutType.trim().toLowerCase().includes(t.toLowerCase()));
    if (isTreadmill) {
      const d: Record<string, string | number> = {};
      const min = treadmillMinutes.trim();
      const cal = treadmillCalories.trim();
      const dist = treadmillDistance.trim();
      if (min) d["시간(분)"] = Number(min) || 0;
      if (cal) d["칼로리(kcal)"] = Number(cal) || 0;
      if (dist) d["거리(km)"] = Number(dist) || 0;
      return Object.keys(d).length ? d : undefined;
    }
    const entries = customDetails.filter((x) => x.key.trim()).map((x) => [x.key.trim(), x.value.trim()] as const);
    if (entries.length === 0) return undefined;
    const obj: Record<string, string | number> = {};
    for (const [k, v] of entries) {
      obj[k] = Number(v) === Number(v) ? Number(v) : v;
    }
    return obj;
  };

  const buildManualDetails = (): Record<string, string | number> | undefined => {
    const isTreadmill = TREADMILL_TYPES.some((t) => manualType.trim().toLowerCase().includes(t.toLowerCase()));
    if (isTreadmill) {
      const d: Record<string, string | number> = {};
      if (manualTreadmillM.trim()) d["시간(분)"] = Number(manualTreadmillM) || 0;
      if (manualTreadmillC.trim()) d["칼로리(kcal)"] = Number(manualTreadmillC) || 0;
      if (manualTreadmillD.trim()) d["거리(km)"] = Number(manualTreadmillD) || 0;
      return Object.keys(d).length ? d : undefined;
    }
    const entries = manualCustomDetails.filter((x) => x.key.trim()).map((x) => [x.key.trim(), x.value.trim()] as const);
    if (entries.length === 0) return undefined;
    const obj: Record<string, string | number> = {};
    for (const [k, v] of entries) {
      obj[k] = Number(v) === Number(v) ? Number(v) : v;
    }
    return obj;
  };

  const addManualEntry = async () => {
    setError(null);
    setBusy(true);
    try {
      const details = buildManualDetails();
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: manualDate,
          startTime: manualStart.trim() || null,
          endTime: manualEnd.trim() || null,
          workoutType: manualType.trim() || null,
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (res.ok) {
        setShowManual(false);
        setManualStart("");
        setManualEnd("");
        setManualType("");
        setManualTreadmillM("");
        setManualTreadmillC("");
        setManualTreadmillD("");
        setManualCustomDetails([]);
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : data.error?.message ?? "저장 실패");
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
      const details = buildDetails();
      const res = await fetch("/api/workouts/end", {
        ...fetchOpts,
        body: JSON.stringify({
          date: getClientDate(),
          endTime: getClientTime(),
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (res.ok) {
        setTreadmillMinutes("");
        setTreadmillCalories("");
        setTreadmillDistance("");
        setCustomDetails([]);
        router.refresh();
      } else {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : data.error?.message ?? "저장 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* 오늘 운동 카드 */}
        <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm p-5 shadow-lg shadow-black/10">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 tracking-tight">오늘 운동</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5 p-3 rounded-xl bg-[hsl(var(--muted))]/50">
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">출석</dt>
              <dd className="font-medium text-[hsl(var(--foreground))]">{attended ? "체크됨" : "미체크"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">오늘 회차</dt>
              <dd className="font-medium text-[hsl(var(--foreground))]">{todaySessions.length}회</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">시작</dt>
              <dd className="font-medium text-[hsl(var(--foreground))]">{displayStart}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">종료</dt>
              <dd className="font-medium text-[hsl(var(--foreground))]">{displayEnd}</dd>
            </div>
          </dl>
          <div className="mb-4">
            <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1.5">
              운동 종목 <span className="text-[hsl(var(--accent))] text-xs">(시작 전 필수)</span>
            </label>
            <input
              type="text"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              placeholder="예: 러닝머신, 러닝, 헬스, 수영"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent transition-shadow"
            />
          </div>
          {TREADMILL_TYPES.some((t) => workoutType.trim().toLowerCase().includes(t.toLowerCase())) ? (
            <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--muted))]/50 space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">러닝머신 기록 (선택)</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">시간(분)</label>
                  <input
                    type="number"
                    min="0"
                    value={treadmillMinutes}
                    onChange={(e) => setTreadmillMinutes(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">칼로리(kcal)</label>
                  <input
                    type="number"
                    min="0"
                    value={treadmillCalories}
                    onChange={(e) => setTreadmillCalories(e.target.value)}
                    placeholder="200"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">거리(km)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={treadmillDistance}
                    onChange={(e) => setTreadmillDistance(e.target.value)}
                    placeholder="3.5"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
          ) : workoutType.trim() !== "" ? (
            <div className="mb-4 p-3 rounded-xl bg-[hsl(var(--muted))]/50 space-y-2">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">추가 항목 (본인이 입력)</p>
              {customDetails.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      setCustomDetails((prev) => prev.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))
                    }
                    placeholder="항목명 (예: 세트, 무게)"
                    className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      setCustomDetails((prev) => prev.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))
                    }
                    placeholder="값"
                    className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomDetails((prev) => prev.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-300 text-sm px-1"
                    aria-label="삭제"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomDetails((prev) => [...prev, { key: "", value: "" }])}
                className="text-xs text-[hsl(var(--accent))] hover:underline"
              >
                + 항목 추가
              </button>
            </div>
          ) : null}
          {error && (
            <p className="text-sm text-red-400 mb-3 px-1" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleAttendance}
              disabled={busy}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--accent))]/50 disabled:opacity-50 transition-colors"
            >
              {attended ? "출석 취소" : "출석 체크"}
            </button>
            <button
              type="button"
              onClick={startWorkout}
              disabled={busy || !workoutType.trim()}
              className="rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              title={!workoutType.trim() ? "운동 종목을 먼저 입력하세요" : undefined}
            >
              운동 시작
            </button>
            <button
              type="button"
              onClick={endWorkout}
              disabled={busy || !hasActiveSession}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--accent))]/50 disabled:opacity-50 transition-colors"
            >
              운동 종료
            </button>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 opacity-80">
            시작/종료 버튼으로 재면서 기록하거나, 아래에서 수동으로 추가할 수 있습니다.
          </p>
          {hasActiveSession && (
            <div className="mt-5 rounded-2xl bg-gradient-to-br from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 border border-[hsl(var(--accent))]/30 p-6 text-center shadow-inner">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                {activeSession?.workoutType ? `현재: ${activeSession.workoutType}` : "운동 중"}
              </p>
              <p className="text-4xl font-mono font-bold tabular-nums text-[hsl(var(--accent))] drop-shadow-sm">
                {formatElapsed(elapsed)}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">경과 시간</p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="text-sm text-[hsl(var(--accent))] hover:underline"
            >
              {showManual ? "수동 입력 접기" : "수동으로 기록 추가"}
            </button>
            {showManual && (
              <div className="mt-3 p-3 rounded-xl bg-[hsl(var(--muted))]/40 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">날짜</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">시작 (HH:MM)</label>
                    <input
                      type="text"
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      placeholder="09:00"
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">종료 (HH:MM)</label>
                    <input
                      type="text"
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      placeholder="10:00"
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">종목</label>
                  <input
                    type="text"
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    placeholder="예: 러닝머신, 헬스"
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                  />
                </div>
                {TREADMILL_TYPES.some((t) => manualType.trim().toLowerCase().includes(t.toLowerCase())) ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">시간(분)</label>
                      <input type="number" min={0} value={manualTreadmillM} onChange={(e) => setManualTreadmillM(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">칼로리(kcal)</label>
                      <input type="number" min={0} value={manualTreadmillC} onChange={(e) => setManualTreadmillC(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-0.5">거리(km)</label>
                      <input type="number" min={0} step={0.1} value={manualTreadmillD} onChange={(e) => setManualTreadmillD(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
                    </div>
                  </div>
                ) : manualType.trim() !== "" ? (
                  <div className="space-y-1">
                    {manualCustomDetails.map((row, i) => (
                      <div key={i} className="flex gap-1 items-center">
                        <input type="text" value={row.key} onChange={(e) => setManualCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))} placeholder="항목" className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm" />
                        <input type="text" value={row.value} onChange={(e) => setManualCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))} placeholder="값" className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm" />
                        <button type="button" onClick={() => setManualCustomDetails((p) => p.filter((_, j) => j !== i))} className="text-red-400 text-sm">삭제</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setManualCustomDetails((p) => [...p, { key: "", value: "" }])} className="text-xs text-[hsl(var(--accent))] hover:underline">+ 항목 추가</button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={addManualEntry}
                  disabled={busy}
                  className="rounded-xl border border-[hsl(var(--accent))]/50 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--accent))]/20 disabled:opacity-50"
                >
                  기록 추가
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 논문 스터디 카드 */}
        <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm p-5 shadow-lg shadow-black/10">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 tracking-tight">논문 스터디</h2>
          <div className="mb-5 p-4 rounded-xl bg-[hsl(var(--muted))]/50">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              이번 주 읽은 논문
            </p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mt-1">{weekPapersCount}개</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/papers"
              className="inline-flex rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--accent))]/50 transition-colors"
            >
              내 논문 보기
            </Link>
            <Link
              href="/papers?add=1"
              className="inline-flex rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              논문 추가 + 리뷰 작성
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
