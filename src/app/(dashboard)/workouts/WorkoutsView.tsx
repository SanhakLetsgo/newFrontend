"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

type Log = {
  id: string;
  userId: string;
  date: string;
  attended: boolean;
  startTime: string | null;
  endTime: string | null;
  user?: { name: string | null };
};

export function WorkoutsView({
  currentParticipantId,
  todaySessions,
  logs,
}: {
  currentParticipantId: string;
  todaySessions: Log[];
  logs: Log[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editModal, setEditModal] = useState<Log | null>(null);
  const [editAttended, setEditAttended] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const hasActiveSession = todaySessions.some((s) => s.startTime && !s.endTime);

  const openEdit = (log: Log) => {
    if (log.userId !== currentParticipantId) return;
    setEditModal(log);
    setEditAttended(log.attended);
    setEditStart(log.startTime ?? "");
    setEditEnd(log.endTime ?? "");
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workouts/log/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          attended: editAttended,
          startTime: editStart.trim() || null,
          endTime: editEnd.trim() || null,
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
      await fetch("/api/workouts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const endToday = async () => {
    setBusy(true);
    try {
      await fetch("/api/workouts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const todayAttended = todaySessions[0]?.attended ?? false;

  return (
    <>
      <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 mb-4">
        <h2 className="text-sm font-semibold mb-2">오늘 기록</h2>
        {todaySessions.length > 0 ? (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
              <dt>출석</dt>
              <dd>{todayAttended ? "O" : "X"}</dd>
              <dt>오늘 회차</dt>
              <dd>{todaySessions.length}회</dd>
            </dl>
            <ul className="text-sm mb-3 space-y-1">
              {todaySessions.map((s, i) => (
                <li key={s.id}>
                  {todaySessions.length - i}회: {s.startTime ?? "—"} ~ {s.endTime ?? "진행 중"} ({calcDuration(s.startTime, s.endTime)})
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">오늘 기록이 없습니다.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleTodayAttendance}
            disabled={busy}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {todayAttended ? "출석 취소" : "출석 체크"}
          </button>
          <button
            type="button"
            onClick={startToday}
            disabled={busy}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
          >
            운동 시작
          </button>
          <button
            type="button"
            onClick={endToday}
            disabled={busy || !hasActiveSession}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-50"
          >
            운동 종료
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-[hsl(var(--border))]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <th className="text-left p-3 font-medium">참여자</th>
              <th className="text-left p-3 font-medium">날짜</th>
              <th className="text-left p-3 font-medium">출석</th>
              <th className="text-left p-3 font-medium">시작</th>
              <th className="text-left p-3 font-medium">끝</th>
              <th className="text-left p-3 font-medium">총 시간</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] ${row.userId === currentParticipantId ? "cursor-pointer" : ""}`}
                onClick={() => openEdit(row)}
              >
                <td className="p-3">{row.user?.name ?? "—"}</td>
                <td className="p-3">{row.date}</td>
                <td className="p-3">{row.attended ? "O" : "X"}</td>
                <td className="p-3">{row.startTime ?? "—"}</td>
                <td className="p-3">{row.endTime ?? "—"}</td>
                <td className="p-3">{calcDuration(row.startTime, row.endTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 shadow-lg max-w-sm w-full">
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
