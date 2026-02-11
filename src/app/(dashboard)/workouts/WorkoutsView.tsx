"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WorkoutStatsPanel } from "./WorkoutStatsPanel";

function parseSetsReps(text: string): { sets: number; reps: number } | null {
  const nums = (text.match(/\d+/g) ?? []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length >= 2) return { sets: Math.round(nums[0]), reps: Math.round(nums[1]) };
  if (nums.length === 1) return { sets: 1, reps: Math.round(nums[0]) };
  return null;
}

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
  reps?: number | null;
  calories?: number | null;
  details?: unknown;
  createdAt?: string | Date | null;
  user?: { name: string | null };
};

const TREADMILL_TYPES = ["러닝머신", "러닝", "러닝 머신"];

type ParticipantStat = { userId: string; name: string; weekCount: number; weekCalories: number; rank: number };
type AttendanceStat = { userId: string; name: string; weekAttendanceDays: number; rank: number };

/** MET(운동강도) 기반 칼로리: kcal = MET × 체중(kg) × 시간(시간) */
const DEFAULT_BODY_WEIGHT_KG = 70;

/** 러닝: 거리·시간·체중으로 MET 기반 계산 (ACSM/Compendium 근사) */
function calcRunningCalories(km: number, min: number, weightKg: number): number {
  if (weightKg <= 0) weightKg = DEFAULT_BODY_WEIGHT_KG;
  if (km > 0 && min > 0) {
    const speedKmh = (km / min) * 60;
    const met = Math.min(14, Math.max(4, 3.5 + 0.8 * speedKmh));
    return met * weightKg * (min / 60);
  }
  if (km > 0) return weightKg * km * 1.04;
  if (min > 0) return weightKg * (8 * (min / 60)) * 1.04;
  return 0;
}

/** 웨이트: MET 4, 세트당 약 2.5분 가정 */
function calcWeightsCalories(sets: number, volumeKg: number, weightKg: number): number {
  if (weightKg <= 0) weightKg = DEFAULT_BODY_WEIGHT_KG;
  const timeHours = (sets * 2.5) / 60;
  const met = 4;
  const base = met * weightKg * timeHours;
  const volumeTerm = volumeKg * 0.012;
  return base + volumeTerm;
}

function estimateCaloriesFromDetails(
  details?: Record<string, unknown> | undefined | null,
  bodyWeightKg?: number
): number | null {
  if (!details) return null;
  const weight = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;
  const min = Number(details["시간(분)"]) || 0;
  const km = Number(details["거리(km)"]) || 0;
  if (km > 0 || min > 0) return Math.max(0, Math.round(calcRunningCalories(km, min, weight))) || null;

  const kg = Number(details["kg"]) || 0;
  const setsRepsText = String(details["횟수/세트"] ?? "").trim();
  const sr = parseSetsReps(setsRepsText);
  if (kg > 0 && sr) {
    const volume = sr.sets * sr.reps * kg;
    return Math.max(0, Math.round(calcWeightsCalories(sr.sets, volume, weight))) || null;
  }
  return null;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function WorkoutsView({
  currentParticipantId,
  todaySessions,
  todayTotalCalories = 0,
  logs,
  weekStart,
  weekEnd,
  allParticipantsStats = [],
  allParticipantsAttendance = [],
}: {
  currentParticipantId: string;
  todaySessions: Log[];
  todayTotalCalories?: number;
  logs: Log[];
  weekStart: string;
  weekEnd: string;
  allParticipantsStats?: ParticipantStat[];
  allParticipantsAttendance?: AttendanceStat[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [workoutType, setWorkoutType] = useState("");
  const [todayReps, setTodayReps] = useState("");
  const [treadmillMinutes, setTreadmillMinutes] = useState("");
  const [treadmillCalories, setTreadmillCalories] = useState("");
  const [treadmillDistance, setTreadmillDistance] = useState("");
  const [customDetails, setCustomDetails] = useState<{ key: string; value: string }[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [category, setCategory] = useState<"treadmill" | "other" | null>(null);
  const [otherTypeName, setOtherTypeName] = useState("");
  const [otherSets, setOtherSets] = useState("");
  const [otherKg, setOtherKg] = useState("");
  const [bodyWeightKg, setBodyWeightKg] = useState("");
  const [endCaloriesInput, setEndCaloriesInput] = useState("");
  const [statsSession, setStatsSession] = useState<Log | null>(null);
  const [editModal, setEditModal] = useState<Log | null>(null);
  const [editAttended, setEditAttended] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editWorkoutType, setEditWorkoutType] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editCalories, setEditCalories] = useState("");
  const [editDetails, setEditDetails] = useState<{ key: string; value: string }[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualDate, setManualDate] = useState(getClientDate());
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualType, setManualType] = useState("");
  const [manualReps, setManualReps] = useState("");
  const [manualTreadmillM, setManualTreadmillM] = useState("");
  const [manualTreadmillC, setManualTreadmillC] = useState("");
  const [manualTreadmillD, setManualTreadmillD] = useState("");
  const [manualCustomDetails, setManualCustomDetails] = useState<{ key: string; value: string }[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyWeeks, setHistoryWeeks] = useState<{ weekStart: string; weekEnd: string; participants: { userId: string; name: string; count: number; calories: number; rank: number }[] }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailParticipant, setDetailParticipant] = useState<{ userId: string; name: string } | null>(null);
  const [calendarParticipant, setCalendarParticipant] = useState<{ userId: string; name: string } | null>(null);

  const hasActiveSession = todaySessions.some((s) => s.startTime && !s.endTime);

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/workouts/history?weeks=12", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistoryWeeks(data.weeks ?? []);
      } else {
        setHistoryWeeks([]);
      }
    } catch {
      setHistoryWeeks([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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
    setEditWorkoutType(log.workoutType ?? "");
    setEditReps(log.reps != null ? String(log.reps) : "");
    setEditCalories(log.calories != null ? String(log.calories) : "");
    setEditDetails(detailsToRows(log.details));
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setBusy(true);
    try {
      const details = rowsToDetails(editDetails);
      const repsNum = editReps.trim() === "" ? null : Math.max(0, Math.round(Number(editReps))) || null;
      const calNum = editCalories.trim() === "" ? null : Math.max(0, Math.round(Number(editCalories))) || null;
      const res = await fetch(`/api/workouts/log/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          attended: editAttended,
          startTime: editStart.trim() || null,
          endTime: editEnd.trim() || null,
          workoutType: editWorkoutType.trim() || null,
          reps: repsNum,
          calories: calNum,
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

  const submitQuickEntryFromModal = async () => {
    const typeLabel = category === "treadmill" ? "러닝머신" : category === "other" ? otherTypeName.trim() : "";
    if (!typeLabel) {
      alert("종목을 선택하고 입력해 주세요.");
      return;
    }
    if (category === "other" && !otherTypeName.trim()) {
      alert("기타 종목명을 입력해 주세요.");
      return;
    }

    const details = buildDetails();
    const caloriesVal =
      category === "treadmill"
        ? treadmillEstimate
        : category === "other"
        ? otherEstimate
        : getEstimatedCalories();

    setBusy(true);
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: getClientDate(),
          workoutType: typeLabel,
          ...(caloriesVal != null && { calories: caloriesVal }),
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        let msg =
          typeof data?.error === "string"
            ? data.error
            : data?.error?.message ?? (data?.fieldErrors && "입력값을 확인해 주세요.") ?? "저장 실패";
        if (res.status === 500 && data?.debug) msg += `\n(${data.debug})`;
        alert(msg);
      } else {
        setShowStartModal(false);
        setCategory(null);
        setOtherTypeName("");
        setOtherSets("");
        setOtherKg("");
        setTreadmillMinutes("");
        setTreadmillDistance("");
        setEndCaloriesInput("");
        setCustomDetails([]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const buildDetails = (): Record<string, string | number> | undefined => {
    if (category === "treadmill") {
      const d: Record<string, string | number> = {};
      if (treadmillMinutes.trim()) d["시간(분)"] = Number(treadmillMinutes) || 0;
      if (treadmillDistance.trim()) d["거리(km)"] = Number(treadmillDistance) || 0;
      return Object.keys(d).length ? d : undefined;
    }
    if (category === "other") {
      const d: Record<string, string | number> = {};
      if (otherSets.trim()) d["횟수/세트"] = otherSets.trim();
      if (otherKg.trim()) d["kg"] = Number(otherKg) || 0;
      return Object.keys(d).length ? d : undefined;
    }
    const isTreadmill = TREADMILL_TYPES.some((t) => workoutType.trim().toLowerCase().includes(t.toLowerCase()));
    if (isTreadmill) {
      const d: Record<string, string | number> = {};
      if (treadmillMinutes.trim()) d["시간(분)"] = Number(treadmillMinutes) || 0;
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

  const bodyWeightNum = bodyWeightKg.trim() === "" ? null : Math.max(0, Number(bodyWeightKg));

  const getEstimatedCalories = (): number | null => {
    const details = buildDetails() as Record<string, unknown> | undefined;
    return estimateCaloriesFromDetails(details, bodyWeightNum ?? undefined);
  };

  const treadmillEstimate = (() => {
    const min = Number(treadmillMinutes) || 0;
    const km = Number(treadmillDistance) || 0;
    if (min <= 0 && km <= 0) return null;
    const w = bodyWeightNum ?? DEFAULT_BODY_WEIGHT_KG;
    return Math.max(0, Math.round(calcRunningCalories(km, min, w))) || null;
  })();

  const otherEstimate = (() => {
    const kg = Number(otherKg) || 0;
    const sr = parseSetsReps(otherSets);
    if (kg <= 0 || !sr) return null;
    const volume = sr.sets * sr.reps * kg;
    const w = bodyWeightNum ?? DEFAULT_BODY_WEIGHT_KG;
    return Math.max(0, Math.round(calcWeightsCalories(sr.sets, volume, w))) || null;
  })();

  const endToday = async () => {
    const details = buildDetails();
    const repsNum = todayReps.trim() === "" ? undefined : Math.max(0, Math.round(Number(todayReps)));
    const caloriesVal = endCaloriesInput.trim() !== ""
      ? Math.max(0, Math.round(Number(endCaloriesInput)))
      : getEstimatedCalories();
    setBusy(true);
    try {
      const res = await fetch("/api/workouts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: getClientDate(),
          endTime: getClientTime(),
          ...(repsNum != null && { reps: repsNum }),
          ...(caloriesVal != null && { calories: caloriesVal }),
          ...(details && Object.keys(details).length > 0 && { details }),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error?.message ?? data.error ?? "종료 실패");
      } else {
        setTodayReps("");
        setTreadmillMinutes("");
        setTreadmillDistance("");
        setEndCaloriesInput("");
        setOtherSets("");
        setOtherKg("");
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
          reps: manualReps.trim() === "" ? undefined : Math.max(0, Math.round(Number(manualReps))),
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
        setManualReps("");
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

  return (
    <>
      {/* 맨 위: 안내 + 오늘 날짜 + 기록하기 + 운동 끝 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]/20 p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 shadow-lg overflow-hidden min-w-0">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-sm" aria-hidden>✓</span>
          <p className="text-sm text-[hsl(var(--foreground))]/90 leading-relaxed min-w-0">
            운동을 하나 이상 기록하면 출석으로 인정돼요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--muted))]/60 px-3 sm:px-3.5 py-2">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">오늘</span>
            <span className="text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">{getClientDate()}</span>
          </div>
          {todayTotalCalories > 0 && !hasActiveSession && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 sm:px-3.5 py-2">
              <span className="text-xs text-amber-600/90">오늘 칼로리</span>
              <span className="text-sm font-bold tabular-nums text-amber-600">{todayTotalCalories} kcal</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowStartModal(true)}
            disabled={busy || hasActiveSession}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 sm:px-5 py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] shadow-md hover:opacity-95 hover:shadow-lg disabled:opacity-50 min-h-[48px] w-full sm:w-auto sm:min-h-0 transition active:scale-[0.98] touch-manipulation"
          >
            <span aria-hidden>✏️</span>
            기록하기
          </button>
          {hasActiveSession && (
            <button
              type="button"
              onClick={endToday}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white px-4 sm:px-5 py-3 text-sm font-semibold shadow-md hover:bg-rose-600 hover:shadow-lg disabled:opacity-50 min-h-[48px] w-full sm:w-auto sm:min-h-0 transition active:scale-[0.98] touch-manipulation"
            >
              <span aria-hidden>⏹</span>
              운동 끝
            </button>
          )}
        </div>
        {hasActiveSession && (() => {
          const active = todaySessions.find((s) => s.startTime && !s.endTime);
          const isTreadmillActive = active?.workoutType && TREADMILL_TYPES.some((t) => (active.workoutType ?? "").toLowerCase().includes(t.toLowerCase()));
          return (
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-3 space-y-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">운동 끝 누르기 전에 아래 입력 후 저장돼요.</p>
            {isTreadmillActive ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
                  <label className="block min-w-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">시간(분)</span>
                    <input type="number" min={0} value={treadmillMinutes} onChange={(e) => setTreadmillMinutes(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 sm:py-1.5 text-base sm:text-sm min-h-[44px]" />
                  </label>
                  <label className="block min-w-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">거리(km)</span>
                    <input type="number" min={0} step={0.1} value={treadmillDistance} onChange={(e) => setTreadmillDistance(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 sm:py-1.5 text-base sm:text-sm min-h-[44px]" />
                  </label>
                  <label className="block min-w-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">칼로리(kcal)</span>
                    <input type="number" min={0} value={endCaloriesInput} onChange={(e) => setEndCaloriesInput(e.target.value)} placeholder="자동 계산됨 (수정 가능)" className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 sm:py-1.5 text-base sm:text-sm min-h-[44px]" />
                  </label>
                </div>
                {treadmillEstimate != null && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    예상 칼로리(자동) · <span className="font-semibold text-amber-600">{treadmillEstimate} kcal</span>
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-wrap gap-2 items-end">
                <label className="block min-w-[120px]">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">칼로리(kcal)</span>
                  <input type="number" min={0} value={endCaloriesInput} onChange={(e) => setEndCaloriesInput(e.target.value)} placeholder="자동 계산됨 (수정 가능)" className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 sm:py-1.5 text-base sm:text-sm min-h-[44px]" />
                </label>
                {(() => {
                  const details = buildDetails() as Record<string, unknown> | undefined;
                  const est = estimateCaloriesFromDetails(details);
                  return est != null ? (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      예상 칼로리(자동) · <span className="font-semibold text-amber-600">{est} kcal</span>
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          );
        })()}
      </section>

      {/* 종목 선택 모달 (기록하기 클릭 시) */}
      {showStartModal && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 pt-safe pb-safe" onClick={() => setShowStartModal(false)} role="dialog" aria-modal="true">
          <div className="rounded-t-2xl sm:rounded-2xl border border-[hsl(var(--border))] border-b-0 sm:border-b bg-[hsl(var(--background))] w-full max-w-md shadow-2xl p-4 sm:p-5 max-h-[85dvh] overflow-y-auto my-0 sm:my-auto min-w-0" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">종목을 선택하세요</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setCategory("treadmill"); setOtherTypeName(""); }}
                className={`rounded-xl border-2 py-3.5 sm:py-3 text-sm font-medium min-h-[48px] active:scale-[0.98] ${category === "treadmill" ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15" : "border-[hsl(var(--border))]"}`}
              >
                러닝머신
              </button>
              <button
                type="button"
                onClick={() => { setCategory("other"); setTreadmillMinutes(""); setTreadmillDistance(""); }}
                className={`rounded-xl border-2 py-3.5 sm:py-3 text-sm font-medium min-h-[48px] active:scale-[0.98] ${category === "other" ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15" : "border-[hsl(var(--border))]"}`}
              >
                기타
              </button>
            </div>
            {category && (
              <label className="block mb-4">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">내 몸무게(kg) · 칼로리 계산용 (비우면 70kg 기준)</span>
                <input type="number" min={20} max={200} step={0.1} value={bodyWeightKg} onChange={(e) => setBodyWeightKg(e.target.value)} placeholder="70" className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
              </label>
            )}
            {category === "treadmill" && (
              <div className="space-y-3 mb-4">
                <label className="block">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">달린 시간(분)</span>
                  <input type="number" min={0} value={treadmillMinutes} onChange={(e) => setTreadmillMinutes(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
                </label>
                <label className="block">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">뛴 거리(km)</span>
                  <input type="number" min={0} step={0.1} value={treadmillDistance} onChange={(e) => setTreadmillDistance(e.target.value)} className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
                </label>
                {treadmillEstimate != null && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    예상 칼로리(자동) · <span className="font-semibold text-amber-600">{treadmillEstimate} kcal</span>
                  </p>
                )}
              </div>
            )}
            {category === "other" && (
              <div className="space-y-3 mb-4">
                <label className="block">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">종목명</span>
                  <input type="text" value={otherTypeName} onChange={(e) => setOtherTypeName(e.target.value)} placeholder="예: 스쿼트, 벤치프레스" className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">횟수/세트</span>
                    <input type="text" value={otherSets} onChange={(e) => setOtherSets(e.target.value)} placeholder="예: 3세트 10회" className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">kg</span>
                    <input type="number" min={0} value={otherKg} onChange={(e) => setOtherKg(e.target.value)} placeholder="0" className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px]" />
                  </label>
                </div>
                {otherEstimate != null && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    예상 칼로리(자동) · <span className="font-semibold text-amber-600">{otherEstimate} kcal</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2 pb-safe sm:pb-0">
              <button type="button" onClick={() => setShowStartModal(false)} className="rounded-lg border border-[hsl(var(--border))] px-4 py-3 sm:py-2 text-sm min-h-[48px] sm:min-h-0 touch-manipulation">취소</button>
              <button
                type="button"
                onClick={submitQuickEntryFromModal}
                disabled={busy || (category === "other" && !otherTypeName.trim())}
                className="rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] px-4 py-3 sm:py-2 text-sm font-medium min-h-[48px] sm:min-h-0 disabled:opacity-50 active:scale-[0.98] touch-manipulation"
              >
                입력 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 참여 현황 + 소모 칼로리 한 화면 시각화 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))]/90 to-[hsl(var(--muted))]/30 p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg overflow-hidden min-w-0">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
          <span className="text-xl sm:text-2xl shrink-0 animate-[bounce_2s_ease-in-out_infinite]" aria-hidden>🏃</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] truncate">참여 현황 · 소모 칼로리</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 sm:line-clamp-none">이번 주 누가 많이 했는지 한눈에 · 동점이면 같은 순위, 먼저 기록한 사람이 위에 표시돼요</p>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {(() => {
            const maxCal = Math.max(1, ...allParticipantsStats.map((p) => p.weekCalories));
            return allParticipantsStats.map((p, i) => {
              const isMe = p.userId === currentParticipantId;
              const calPct = maxCal > 0 ? (p.weekCalories / maxCal) * 100 : 0;
              const rank = p.rank;
              return (
                <button
                  type="button"
                  key={p.userId}
                  onClick={() => setDetailParticipant({ userId: p.userId, name: p.name })}
                  className={`w-full text-left rounded-xl border p-3 sm:p-3 transition-all active:scale-[0.99] hover:opacity-95 min-h-[56px] touch-manipulation ${
                    isMe ? "border-emerald-500/50 bg-emerald-500/10" : "border-[hsl(var(--border))] bg-[hsl(var(--card))]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-bold tabular-nums">{rank}</span>
                      <span className="font-medium truncate text-sm sm:text-base">{p.name}{isMe && <span className="ml-1 text-xs text-emerald-600">(나)</span>}</span>
                      <span className="hidden sm:inline-block text-sm shrink-0 animate-[run-step_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s` }} aria-hidden>🏃</span>
                    </span>
                    <span className="shrink-0 text-xs sm:text-sm font-bold tabular-nums text-amber-500">
                      {p.weekCalories} kcal
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-10 sm:w-12 shrink-0">칼로리</span>
                    <div className="flex-1 min-w-0 h-2 rounded-full overflow-hidden bg-[hsl(var(--muted))]/60">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 origin-left animate-[bar-grow_0.8s_ease-out_both]" style={{ width: `${calPct}%`, animationDelay: `${i * 0.08}s` }} />
                    </div>
                  </div>
                </button>
              );
            });
          })()}
        </div>
        <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
          <button
            type="button"
            onClick={openHistoryModal}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 py-3 sm:py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] active:scale-[0.99] min-h-[48px] touch-manipulation"
          >
            이전 현황 확인하러 가기
          </button>
        </div>
      </section>

      {/* 참여자별 이번 주 운동 상세 모달 */}
      {detailParticipant && (() => {
        const weekLogs = logs
          .filter((l) => l.userId === detailParticipant.userId && l.date >= weekStart && l.date <= weekEnd)
          .sort((a, b) => a.date.localeCompare(b.date) || (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const totalCal = weekLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);
        const isMe = detailParticipant.userId === currentParticipantId;
        return (
          <div
            className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 pt-safe pb-safe"
            onClick={() => setDetailParticipant(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="rounded-t-2xl sm:rounded-2xl border border-[hsl(var(--border))] border-b-0 sm:border-b bg-[hsl(var(--background))] w-full max-w-lg max-h-[85dvh] overflow-hidden flex flex-col my-0 sm:my-auto shadow-2xl min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 shrink-0 bg-gradient-to-r from-[hsl(var(--accent))]/10 to-transparent">
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                    {detailParticipant.name}{isMe && <span className="ml-1.5 text-sm text-emerald-600">(나)</span>}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {weekStart} ~ {weekEnd} · 이번 주 운동
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailParticipant(null)}
                  className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors touch-manipulation shrink-0"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-4 pb-safe sm:pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] p-3 sm:p-4 text-center min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-[hsl(var(--accent))] tabular-nums">{weekLogs.length}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">총 운동 횟수</p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 sm:p-4 text-center min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">{totalCal}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">총 소모 칼로리 (kcal)</p>
                  </div>
                </div>
                {weekLogs.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">이번 주 기록이 없어요.</p>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">운동 기록 · 날짜별</h4>
                    {(() => {
                      const logsByDate: Record<string, typeof weekLogs> = {};
                      for (const log of weekLogs) {
                        if (!logsByDate[log.date]) logsByDate[log.date] = [];
                        logsByDate[log.date].push(log);
                      }
                      const weekDatesOrdered: string[] = [];
                      const d = new Date(weekStart + "T12:00:00");
                      const end = new Date(weekEnd + "T12:00:00");
                      while (d <= end) {
                        weekDatesOrdered.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                        d.setDate(d.getDate() + 1);
                      }
                      return weekDatesOrdered.map((date) => {
                        const dayLogs = logsByDate[date] ?? [];
                        if (dayLogs.length === 0) return null;
                        const dayOfWeek = new Date(date + "T12:00:00").getDay();
                        const weekday = WEEKDAY_LABELS[dayOfWeek];
                        const dayCal = dayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);
                        return (
                          <div key={date} className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                                {date} ({weekday})
                              </span>
                              {dayCal > 0 && (
                                <span className="text-xs font-semibold text-amber-600 tabular-nums">{dayCal} kcal</span>
                              )}
                            </div>
                            <div className="space-y-2">
                              {dayLogs.map((log) => {
                                const details = (log.details ?? {}) as Record<string, unknown>;
                                const min = Number(details["시간(분)"]) || 0;
                                const km = Number(details["거리(km)"]) || 0;
                                return (
                                  <div
                                    key={log.id}
                                    className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 overflow-hidden"
                                  >
                                    <div className="p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] px-2.5 py-1 text-sm font-medium">
                                          🏃 {log.workoutType ?? "—"}
                                        </span>
                                        <span className="flex items-center gap-2">
                                          {log.attended && (
                                            <span className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">출석</span>
                                          )}
                                          {log.calories != null && (
                                            <span className="text-sm font-semibold text-amber-600">{log.calories} kcal</span>
                                          )}
                                          {log.reps != null && (
                                            <span className="text-sm text-[hsl(var(--muted-foreground))]">{log.reps}회</span>
                                          )}
                                        </span>
                                      </div>
                                      {(min > 0 || km > 0) && (
                                        <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                                          {min > 0 && <span>⏱ {min}분</span>}
                                          {km > 0 && <span>📏 {km} km</span>}
                                        </div>
                                      )}
                                      {log.startTime && log.endTime && (
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                          {log.startTime} ~ {log.endTime} ({calcDuration(log.startTime, log.endTime)})
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 이번주 출석왕은? (하루 1회 출석 기준 랭킹) */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg overflow-hidden min-w-0">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
          <span className="text-xl sm:text-2xl shrink-0" aria-hidden>👑</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-[hsl(var(--foreground))] truncate">이번주 출석왕은?</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 sm:line-clamp-none">운동 기록한 날 기준, 하루 1회 출석 · 동점이면 같은 순위, 먼저 기록한 사람이 위에 표시돼요</p>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {(() => {
            const maxDays = Math.max(1, ...allParticipantsAttendance.map((p) => p.weekAttendanceDays));
            return allParticipantsAttendance.map((p, i) => {
              const isMe = p.userId === currentParticipantId;
              const pct = maxDays > 0 ? (p.weekAttendanceDays / maxDays) * 100 : 0;
              const rank = p.rank;
              return (
                <button
                  type="button"
                  key={p.userId}
                  onClick={() => setCalendarParticipant({ userId: p.userId, name: p.name })}
                  className={`w-full text-left rounded-xl border p-3 transition-all active:scale-[0.99] hover:opacity-95 min-h-[56px] touch-manipulation ${
                    isMe ? "border-emerald-500/50 bg-emerald-500/10" : "border-[hsl(var(--border))] bg-[hsl(var(--card))]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                    <span className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[10px] font-bold tabular-nums">{rank}</span>
                      <span className="font-medium truncate text-sm sm:text-base">{p.name}{isMe && <span className="ml-1 text-xs text-emerald-600">(나)</span>}</span>
                    </span>
                    <span className="shrink-0 text-xs sm:text-sm font-bold tabular-nums text-[hsl(var(--accent))]">
                      {p.weekAttendanceDays}일
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] w-10 sm:w-12 shrink-0">출석</span>
                    <div className="flex-1 min-w-0 h-2 rounded-full overflow-hidden bg-[hsl(var(--muted))]/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 origin-left animate-[bar-grow_0.8s_ease-out_both]"
                        style={{ width: `${pct}%`, animationDelay: `${i * 0.08}s` }}
                      />
                    </div>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </section>

      {/* 출석왕 이름 클릭 → 이번 주 달력(일자별 운동·칼로리) 모달 */}
      {calendarParticipant && (() => {
        const weekDates: string[] = [];
        const d = new Date(weekStart + "T12:00:00");
        const end = new Date(weekEnd + "T12:00:00");
        while (d <= end) {
          weekDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
          d.setDate(d.getDate() + 1);
        }
        const logsByDate = weekDates.map((date) => {
          const dayLogs = logs
            .filter((l) => l.userId === calendarParticipant.userId && l.date === date)
            .sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0));
          const dayCal = dayLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);
          return { date, dayLogs, dayCal };
        });
        const weekTotalCal = logsByDate.reduce((sum, { dayCal }) => sum + dayCal, 0);
        const isMe = calendarParticipant.userId === currentParticipantId;
        return (
          <div
            className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm pt-safe pb-safe"
            onClick={() => setCalendarParticipant(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="rounded-t-2xl sm:rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] w-full max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col my-0 sm:my-auto shadow-2xl min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-[hsl(var(--border))] shrink-0 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent">
                <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-lg" aria-hidden>📅</span>
                    <div>
                      <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
                        {calendarParticipant.name}{isMe && <span className="ml-1.5 text-sm font-medium text-emerald-500">(나)</span>}
                      </h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {weekStart} ~ {weekEnd}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {weekTotalCal > 0 && (
                      <span className="rounded-full bg-amber-500/20 px-3 py-1.5 text-sm font-bold text-amber-600 tabular-nums">
                        🔥 {weekTotalCal} kcal
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCalendarParticipant(null)}
                      className="rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors touch-manipulation"
                      aria-label="닫기"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 pb-safe sm:pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {logsByDate.map(({ date, dayLogs, dayCal }) => {
                    const dayNum = new Date(date + "T12:00:00").getDay();
                    const weekday = WEEKDAY_LABELS[dayNum];
                    const [y, m, day] = date.split("-");
                    const shortDate = `${Number(m)}/${Number(day)}`;
                    const hasWorkout = dayLogs.length > 0;
                    return (
                      <div
                        key={date}
                        className={`rounded-2xl overflow-hidden border-2 transition-all ${
                          hasWorkout
                            ? "border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent shadow-md"
                            : "border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40"
                        }`}
                      >
                        <div className={`px-4 py-2.5 flex items-center justify-between ${hasWorkout ? "bg-amber-500/10" : "bg-[hsl(var(--muted))]/30"}`}>
                          <span className={`text-sm font-bold tabular-nums ${hasWorkout ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}>
                            {shortDate} <span className="font-normal text-xs">({weekday})</span>
                          </span>
                          {dayCal > 0 && (
                            <span className="rounded-full bg-amber-500/25 px-2.5 py-0.5 text-xs font-bold text-amber-600 tabular-nums">
                              {dayCal} kcal
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-2 min-h-[64px]">
                          {dayLogs.length === 0 ? (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-2">운동 없음</p>
                          ) : (
                            dayLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between gap-2 rounded-lg bg-[hsl(var(--background))]/80 px-2.5 py-2 border border-[hsl(var(--border))]/50"
                              >
                                <span className="flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--foreground))] truncate">
                                  <span className="text-base" aria-hidden>🏃</span>
                                  {log.workoutType ?? "—"}
                                </span>
                                <span className="shrink-0 text-sm font-bold text-amber-500 tabular-nums">
                                  {log.calories != null ? `${log.calories} kcal` : "—"}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
        <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 overflow-y-auto pt-safe pb-safe" role="dialog" aria-modal="true">
          <div className="rounded-t-2xl sm:rounded-xl border border-[hsl(var(--border))] border-b-0 sm:border-b bg-[hsl(var(--muted))] p-4 shadow-lg w-full max-w-[min(100vw-1.5rem,24rem)] sm:max-w-sm max-h-[88dvh] overflow-y-auto my-0 sm:my-auto min-w-0">
            <h3 className="font-semibold mb-3">{editModal.date} 수정</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={editAttended}
                  onChange={(e) => setEditAttended(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm">출석</span>
              </label>
              <div>
                <label className="block text-sm mb-1">종목</label>
                <input
                  type="text"
                  value={editWorkoutType}
                  onChange={(e) => setEditWorkoutType(e.target.value)}
                  placeholder="예: 러닝, 헬스"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">회수</label>
                <input
                  type="number"
                  min={0}
                  value={editReps}
                  onChange={(e) => setEditReps(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">칼로리 (kcal)</label>
                <input
                  type="number"
                  min={0}
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  placeholder="선택"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">시작 (HH:MM)</label>
                <input
                  type="text"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  placeholder="09:00"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">끝 (HH:MM)</label>
                <input
                  type="text"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  placeholder="10:00"
                  className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
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
            <div className="flex gap-2 justify-end mt-4 pt-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="rounded-md border border-[hsl(var(--border))] px-4 py-2.5 sm:py-1.5 text-sm min-h-[44px] sm:min-h-0"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2.5 sm:py-1.5 text-sm min-h-[44px] sm:min-h-0 disabled:opacity-50 active:scale-[0.98]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이전 현황 (주차별 등수·참여·칼로리) 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 pt-safe pb-safe" onClick={() => setShowHistoryModal(false)} role="dialog" aria-modal="true">
          <div className="rounded-t-2xl sm:rounded-2xl border border-[hsl(var(--border))] border-b-0 sm:border-b bg-[hsl(var(--background))] w-full max-w-lg max-h-[85dvh] overflow-hidden flex flex-col my-0 sm:my-auto min-w-0" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 shrink-0">
              <h3 className="text-base sm:text-lg font-semibold truncate min-w-0">주차별 이전 현황</h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] touch-manipulation shrink-0">닫기</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 pb-safe sm:pb-4">
              {historyLoading ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] py-8 text-center">불러오는 중...</p>
              ) : historyWeeks.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] py-8 text-center">아직 저장된 데이터가 없습니다.</p>
              ) : (
                <div className="space-y-6">
                  {historyWeeks.map((week) => (
                    <div key={`${week.weekStart}-${week.weekEnd}`} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 overflow-hidden">
                      <div className="px-3 py-2 bg-[hsl(var(--muted))]/50 text-sm font-medium text-[hsl(var(--foreground))]">
                        {week.weekStart} ~ {week.weekEnd}
                      </div>
                      <ul className="divide-y divide-[hsl(var(--border))]">
                        {week.participants.map((p) => (
                          <li
                            key={p.userId}
                            className={`flex items-center justify-between gap-2 px-3 py-2.5 text-sm ${p.userId === currentParticipantId ? "bg-emerald-500/10" : ""}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-xs font-bold tabular-nums">{p.rank}</span>
                              <span className="truncate font-medium">{p.name}{p.userId === currentParticipantId && <span className="ml-1 text-emerald-600">(나)</span>}</span>
                            </span>
                            <span className="shrink-0 flex gap-3 tabular-nums">
                              <span className="text-[hsl(var(--accent))]">{p.count}회</span>
                              <span className="text-amber-600">{p.calories} kcal</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
