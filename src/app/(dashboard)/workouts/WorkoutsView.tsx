"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WorkoutStatsPanel } from "./WorkoutStatsPanel";

function calcDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let m = (eh * 60 + em) - (sh * 60 + sm);
  if (m < 0) return "—";
  const h = Math.floor(m / 60);
  m = m % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function getClientDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getClientTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDetails(d: unknown): string {
  if (d == null || typeof d !== "object" || Array.isArray(d)) return "—";
  const parts = Object.entries(d as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(", ") : "—";
}

type Log = {
  id: string;
  userId: string;
  date: string;
  attended: boolean;
  startTime: string | null;
  endTime: string | null;
  workoutType?: string | null;
  details?: unknown;
  createdAt?: Date | null;
  user?: { name: string | null };
};

const TREADMILL_TYPES = ["러닝머신", "러닝", "러닝 머신"];

type ParticipantStat = { userId: string; name: string; weekCount: number };

export function WorkoutsView({
  currentParticipantId,
  todaySessions,
  logs,
  allParticipantsStats = [],
}: {
  currentParticipantId: string;
  todaySessions: Log[];
  logs: Log[];
  allParticipantsStats?: ParticipantStat[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [workoutType, setWorkoutType] = useState("");
  const [treadmillMinutes, setTreadmillMinutes] = useState("");
  const [treadmillCalories, setTreadmillCalories] = useState("");
  const [treadmillDistance, setTreadmillDistance] = useState("");
  const [customDetails, setCustomDetails] = useState<{ key: string; value: string }[]>([]);
  const [statsSession, setStatsSession] = useState<Log | null>(null);
  const [editModal, setEditModal] = useState<Log | null>(null);
  const [editAttended, setEditAttended] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDetails, setEditDetails] = useState<{ key: string; value: string }[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualDate, setManualDate] = useState(getClientDate());
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualType, setManualType] = useState("");
  const [manualTreadmillM, setManualTreadmillM] = useState("");
  const [manualTreadmillC, setManualTreadmillC] = useState("");
  const [manualTreadmillD, setManualTreadmillD] = useState("");
  const [manualCustomDetails, setManualCustomDetails] = useState<{ key: string; value: string }[]>([]);

  const hasActiveSession = todaySessions.some((s) => s.startTime && !s.endTime);

  function detailsToRows(d: unknown): { key: string; value: string }[] {
    if (d == null || typeof d !== "object" || Array.isArray(d)) return [];
    return Object.entries(d as Record<string, unknown>).map(([k, v]) => ({ key: k, value: String(v) }));
  }

  function rowsToDetails(rows: { key: string; value: string }[]): Record<string, string | number> | undefined {
    const entries = rows.filter((x) => x.key.trim()).map((x) => [x.key.trim(), x.value.trim()] as const);
    if (entries.length === 0) return undefined;
    const obj: Record<string, string | number> = {};
    for (const [k, v] of entries) {
      obj[k] = Number(v) === Number(v) ? Number(v) : v;
    }
    return obj;
  }

  const openEdit = (log: Log) => {
    if (log.userId !== currentParticipantId) return;
    setStatsSession(null);
    setEditModal(log);
    setEditAttended(log.attended);
    setEditStart(log.startTime ?? "");
    setEditEnd(log.endTime ?? "");
    setEditDetails(detailsToRows(log.details));
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setBusy(true);
    try {
      const details = rowsToDetails(editDetails);
      const res = await fetch(`/api/workouts/log/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          attended: editAttended,
          startTime: editStart.trim() || null,
          endTime: editEnd.trim() || null,
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (res.ok) {
        setEditModal(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error?.error ?? data.error ?? "저장 실패");
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleTodayAttendance = async () => {
    const currentAttended = todaySessions[0]?.attended ?? false;
    setBusy(true);
    try {
      await fetch("/api/workouts/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ attended: !currentAttended }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const startToday = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/workouts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: getClientDate(),
          startTime: getClientTime(),
          workoutType: workoutType.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? data.error ?? "시작 실패");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const buildDetails = (): Record<string, string | number> | undefined => {
    const isTreadmill = TREADMILL_TYPES.some((t) => workoutType.trim().toLowerCase().includes(t.toLowerCase()));
    if (isTreadmill) {
      const d: Record<string, string | number> = {};
      if (treadmillMinutes.trim()) d["시간(분)"] = Number(treadmillMinutes) || 0;
      if (treadmillCalories.trim()) d["칼로리(kcal)"] = Number(treadmillCalories) || 0;
      if (treadmillDistance.trim()) d["거리(km)"] = Number(treadmillDistance) || 0;
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

  const endToday = async () => {
    setBusy(true);
    try {
      const details = buildDetails();
      const res = await fetch("/api/workouts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: getClientDate(),
          endTime: getClientTime(),
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? data.error ?? "종료 실패");
      } else {
        setTreadmillMinutes("");
        setTreadmillCalories("");
        setTreadmillDistance("");
        setCustomDetails([]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
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
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? data.error ?? "저장 실패");
      } else {
        setShowManual(false);
        setManualStart("");
        setManualEnd("");
        setManualType("");
        setManualTreadmillM("");
        setManualTreadmillC("");
        setManualTreadmillD("");
        setManualCustomDetails([]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const todayAttended = todaySessions[0]?.attended ?? false;

  return (
    <>
      {/* 전체 참여자 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-4 sm:p-5 mb-6 sm:mb-8 shadow-lg shadow-black/5">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
          전체 참여자 현황
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">이번 주 운동 기록</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allParticipantsStats.map((p) => (
            <div
              key={p.userId}
              className={`rounded-xl border p-4 ${
                p.userId === currentParticipantId
                  ? "border-[hsl(var(--accent))]/50 bg-[hsl(var(--accent))]/10"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
              }`}
            >
              <p className="font-medium text-[hsl(var(--foreground))]">
                {p.name}
                {p.userId === currentParticipantId && (
                  <span className="ml-2 text-xs text-[hsl(var(--accent))]">(나)</span>
                )}
              </p>
              <p className="text-2xl font-bold text-[hsl(var(--accent))] mt-1">{p.weekCount}회</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">이번 주</p>
            </div>
          ))}
        </div>
      </section>

      {/* 내 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-4 sm:p-5 mb-6 shadow-lg shadow-black/5">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
          내 현황
        </h2>

        {/* ★ 오늘 운동 기록하기 – 상단에 강조 */}
        <div className="rounded-xl border border-[hsl(var(--accent))]/30 bg-[hsl(var(--accent))]/5 p-4 sm:p-5 mb-4 sm:mb-5">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <span className="text-[hsl(var(--accent))]">+</span> 오늘 운동 기록하기
          </h3>
          <div className="mb-3">
            <label className="block text-sm text-[hsl(var(--muted-foreground))] mb-1.5">
              운동 종목 <span className="text-[hsl(var(--accent))]">(필수)</span>
            </label>
            <input
              type="text"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              placeholder="예: 러닝머신, 헬스, 수영"
              className="w-full max-w-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
            />
          </div>
          {TREADMILL_TYPES.some((t) => workoutType.trim().toLowerCase().includes(t.toLowerCase())) ? (
            <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--muted))]/50 grid grid-cols-3 gap-2">
              <input type="number" min={0} value={treadmillMinutes} onChange={(e) => setTreadmillMinutes(e.target.value)} placeholder="분" className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
              <input type="number" min={0} value={treadmillCalories} onChange={(e) => setTreadmillCalories(e.target.value)} placeholder="kcal" className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
              <input type="number" min={0} step={0.1} value={treadmillDistance} onChange={(e) => setTreadmillDistance(e.target.value)} placeholder="km" className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm" />
            </div>
          ) : workoutType.trim() !== "" ? (
            <div className="mb-3 p-2 rounded-lg bg-[hsl(var(--muted))]/50 space-y-1">
              {customDetails.map((row, i) => (
                <div key={i} className="flex gap-1">
                  <input type="text" value={row.key} onChange={(e) => setCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))} placeholder="항목" className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm" />
                  <input type="text" value={row.value} onChange={(e) => setCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))} placeholder="값" className="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-sm" />
                  <button type="button" onClick={() => setCustomDetails((p) => p.filter((_, j) => j !== i))} className="text-red-400 text-sm px-1">삭제</button>
                </div>
              ))}
              <button type="button" onClick={() => setCustomDetails((p) => [...p, { key: "", value: "" }])} className="text-xs text-[hsl(var(--accent))] hover:underline">+ 항목 추가</button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startToday}
              disabled={busy || !workoutType.trim()}
              className="rounded-lg bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--accent-foreground))] hover:opacity-95 disabled:opacity-50 transition-opacity"
              title={!workoutType.trim() ? "운동 종목을 먼저 입력하세요" : undefined}
            >
              운동 시작
            </button>
            <button
              type="button"
              onClick={endToday}
              disabled={busy || !hasActiveSession}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))]/80 disabled:opacity-50 transition-colors"
            >
              운동 종료
            </button>
            <button
              type="button"
              onClick={toggleTodayAttendance}
              disabled={busy}
              className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))]/80 disabled:opacity-50 transition-colors"
            >
              {todayAttended ? "출석 취소" : "출석 체크"}
            </button>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">시작 → 종료로 한 번에 기록하거나, 아래에서 수동으로 추가할 수 있어요.</p>
        </div>

        {/* 오늘 기록 요약 */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2">오늘 기록</h3>
          {todaySessions.length > 0 ? (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                <dt className="text-[hsl(var(--muted-foreground))]">출석</dt>
                <dd>{todayAttended ? "O" : "X"}</dd>
                <dt className="text-[hsl(var(--muted-foreground))]">오늘 회차</dt>
                <dd>{todaySessions.length}회</dd>
              </dl>
              <ul className="text-sm mb-0 space-y-1">
                {todaySessions.map((s, i) => (
                  <li key={s.id}>
                    {todaySessions.length - i}회: {s.startTime ?? "—"} ~ {s.endTime ?? "진행 중"} ({calcDuration(s.startTime, s.endTime)})
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">오늘 기록이 없습니다. 위에서 운동 종목을 입력하고 「운동 시작」을 눌러 추가하세요.</p>
          )}
        </div>

        {/* 수동으로 기록 추가 – 항상 보이게 */}
        <div className="mb-4">
          <button type="button" onClick={() => setShowManual((v) => !v)} className="text-sm font-medium text-[hsl(var(--accent))] hover:underline flex items-center gap-1">
            {showManual ? "▲ 수동 입력 접기" : "▼ 수동으로 기록 추가 (날짜·시간 직접 입력)"}
          </button>
          {showManual && (
            <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--muted))]/50 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs mb-0.5">날짜</label>
                  <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full rounded border border-[hsl(var(--border))] px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-0.5">시작 (HH:MM)</label>
                  <input type="text" value={manualStart} onChange={(e) => setManualStart(e.target.value)} placeholder="09:00" className="w-full rounded border border-[hsl(var(--border))] px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-0.5">종료 (HH:MM)</label>
                  <input type="text" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} placeholder="10:00" className="w-full rounded border border-[hsl(var(--border))] px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-0.5">종목</label>
                <input type="text" value={manualType} onChange={(e) => setManualType(e.target.value)} placeholder="예: 러닝머신, 헬스" className="w-full rounded border border-[hsl(var(--border))] px-2 py-1.5 text-sm" />
              </div>
              {TREADMILL_TYPES.some((t) => manualType.trim().toLowerCase().includes(t.toLowerCase())) ? (
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={0} value={manualTreadmillM} onChange={(e) => setManualTreadmillM(e.target.value)} placeholder="분" className="rounded border px-2 py-1 text-sm" />
                  <input type="number" min={0} value={manualTreadmillC} onChange={(e) => setManualTreadmillC(e.target.value)} placeholder="kcal" className="rounded border px-2 py-1 text-sm" />
                  <input type="number" min={0} step={0.1} value={manualTreadmillD} onChange={(e) => setManualTreadmillD(e.target.value)} placeholder="km" className="rounded border px-2 py-1 text-sm" />
                </div>
              ) : manualType.trim() !== "" ? (
                <div className="space-y-1">
                  {manualCustomDetails.map((row, i) => (
                    <div key={i} className="flex gap-1">
                      <input type="text" value={row.key} onChange={(e) => setManualCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))} placeholder="항목" className="flex-1 rounded border px-2 py-1 text-sm" />
                      <input type="text" value={row.value} onChange={(e) => setManualCustomDetails((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))} placeholder="값" className="flex-1 rounded border px-2 py-1 text-sm" />
                      <button type="button" onClick={() => setManualCustomDetails((p) => p.filter((_, j) => j !== i))} className="text-red-400 text-sm">삭제</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setManualCustomDetails((p) => [...p, { key: "", value: "" }])} className="text-xs text-[hsl(var(--accent))]">+ 항목 추가</button>
                </div>
              ) : null}
              <button type="button" onClick={addManualEntry} disabled={busy} className="rounded-md border border-[hsl(var(--accent))]/50 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] px-3 py-1.5 text-sm hover:bg-[hsl(var(--accent))]/20 disabled:opacity-50">
                기록 추가
              </button>
            </div>
          )}
        </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg border border-[hsl(var(--border))] mt-4">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">참여자</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">날짜</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">종목</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap hidden md:table-cell">상세</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">출석</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">시작</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">끝</th>
              <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap">총 시간</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${row.userId === currentParticipantId ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (row.userId === currentParticipantId) setStatsSession(row);
                  else openEdit(row);
                }}
              >
                <td className="p-2 sm:p-3">{row.user?.name ?? "—"}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap">{row.date}</td>
                <td className="p-2 sm:p-3">{row.workoutType ?? "—"}</td>
                <td className="p-2 sm:p-3 max-w-[120px] md:max-w-[180px] truncate text-xs text-[hsl(var(--muted-foreground))] hidden md:table-cell" title={formatDetails(row.details)}>{formatDetails(row.details)}</td>
                <td className="p-2 sm:p-3">{row.attended ? "O" : "X"}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap">{row.startTime ?? "—"}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap">{row.endTime ?? "—"}</td>
                <td className="p-2 sm:p-3 whitespace-nowrap">{calcDuration(row.startTime, row.endTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>

      {statsSession && (
        <WorkoutStatsPanel
          session={statsSession}
          myLogs={logs.filter((l) => l.userId === currentParticipantId)}
          todayCount={todaySessions.length}
          onClose={() => setStatsSession(null)}
          onEdit={() => {
            if (statsSession) openEdit(statsSession);
            setStatsSession(null);
          }}
        />
      )}

      {editModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 shadow-lg w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm my-auto">
            <h3 className="font-semibold mb-3">{editModal.date} 수정</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editAttended}
                  onChange={(e) => setEditAttended(e.target.checked)}
                />
                <span className="text-sm">출석</span>
              </label>
              <div>
                <label className="block text-sm mb-1">시작 (HH:MM)</label>
                <input
                  type="text"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  placeholder="09:00"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">끝 (HH:MM)</label>
                <input
                  type="text"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  placeholder="10:00"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[hsl(var(--muted-foreground))]">상세 기록 (선택)</label>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">예: 시간(분), 칼로리(kcal), 거리(km), 세트, 무게 등</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editDetails.map((row, i) => (
                    <div key={i} className="flex gap-1 items-center">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) =>
                          setEditDetails((p) => p.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))
                        }
                        placeholder="항목명"
                        className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) =>
                          setEditDetails((p) => p.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))
                        }
                        placeholder="값"
                        className="flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditDetails((p) => p.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-300 text-sm px-1"
                        aria-label="삭제"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditDetails((p) => [...p, { key: "", value: "" }])}
                  className="mt-1 text-xs text-[hsl(var(--accent))] hover:underline"
                >
                  + 항목 추가
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-sm disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
