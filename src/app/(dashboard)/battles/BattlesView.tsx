"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function WorkoutBattleForm({ onAdded }: { onAdded: () => void }) {
  const [sport, setSport] = useState("");
  const [participantA, setParticipantA] = useState("");
  const [participantB, setParticipantB] = useState("");
  const [result, setResult] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!sport.trim() || !participantA.trim() || !participantB.trim() || !result.trim()) {
      setErr("종목, 대전자 둘, 결과를 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    fetch("/api/battles/workout/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        sport: sport.trim(),
        participantA: participantA.trim(),
        participantB: participantB.trim(),
        result: result.trim(),
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((b) => Promise.reject(new Error(b.error ?? "저장 실패")));
        return r.json();
      })
      .then(() => {
        setSport("");
        setParticipantA("");
        setParticipantB("");
        setResult("");
        onAdded();
      })
      .catch((e) => setErr(e.message ?? "저장 실패"))
      .finally(() => setSubmitting(false));
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 p-4 space-y-3">
      <h3 className="text-sm font-medium text-[hsl(var(--foreground))]">배틀 기록 추가</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">종목</span>
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="예: 러닝머신, 스쿼트"
            className="mt-0.5 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">대전자 A</span>
          <input
            type="text"
            value={participantA}
            onChange={(e) => setParticipantA(e.target.value)}
            placeholder="이름"
            className="mt-0.5 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">대전자 B</span>
          <input
            type="text"
            value={participantB}
            onChange={(e) => setParticipantB(e.target.value)}
            placeholder="이름"
            className="mt-0.5 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">결과</span>
          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="예: A 승, 3:2, 무승부"
            className="mt-0.5 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-500 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
        >
          {submitting ? "저장 중…" : "기록 추가"}
        </button>
        {err && <span className="text-sm text-red-500">{err}</span>}
      </div>
    </form>
  );
}

type ProblemRankingRow = {
  rank: number;
  userId: string;
  name: string;
  timeSeconds: number | null;
};

type CodingProblemWithRankings = {
  id: string;
  title: string;
  rankings: ProblemRankingRow[];
};

type WorkoutMatch = {
  id: string;
  sport: string;
  participantA: string;
  participantB: string;
  result: string;
  createdAt: string;
  recordedByName: string;
};

function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}초`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

export function BattlesView({ currentUserId }: { currentUserId: string }) {
  const [codingProblemRankings, setCodingProblemRankings] = useState<{
    weekStart: string;
    weekEnd: string;
    problems: CodingProblemWithRankings[];
  } | null>(null);
  const [workoutMatches, setWorkoutMatches] = useState<WorkoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkoutMatches = () => {
    fetch("/api/battles/workout/matches", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.resolve({ matches: [] })))
      .then((data: { matches?: WorkoutMatch[] }) => setWorkoutMatches(data.matches ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/battles/coding/problem-rankings", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("코딩 배틀 로드 실패"))
      ),
      fetch("/api/battles/workout/matches", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : Promise.resolve({ matches: [] })
      ),
    ])
      .then(([c, m]) => {
        if (!cancelled) {
          setCodingProblemRankings(c);
          setWorkoutMatches((m as { matches?: WorkoutMatch[] }).matches ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "로드 실패");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
        로딩 중…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  const weekLabel = codingProblemRankings
    ? `${codingProblemRankings.weekStart} ~ ${codingProblemRankings.weekEnd}`
    : "";

  return (
    <div className="space-y-8">
      {/* 코딩배틀 (위로) */}
      <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent p-4 sm:p-6 shadow-lg shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <span aria-hidden>💻</span> 코딩배틀
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{weekLabel}</p>
          </div>
          <Link
            href="/battles/coding"
            className="shrink-0 rounded-lg bg-amber-500 text-zinc-900 px-3 py-2 text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            문제 풀고 참가하기 →
          </Link>
        </div>
        {codingProblemRankings && codingProblemRankings.problems.length > 0 ? (
          <ul className="space-y-4">
            {codingProblemRankings.problems.map((problem) => (
              <li
                key={problem.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 overflow-hidden"
              >
                <Link
                  href={`/battles/coding/${problem.id}`}
                  className="block px-4 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 hover:bg-amber-500/10 transition-colors"
                >
                  <span className="font-medium text-[hsl(var(--foreground))]">{problem.title}</span>
                  <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">→ 풀기</span>
                </Link>
                <div className="px-4 py-3">
                  {problem.rankings.length > 0 ? (
                    <ul className="space-y-1.5">
                      {problem.rankings.map((r) => (
                        <li
                          key={r.userId}
                          className={`flex items-center justify-between text-sm ${
                            r.userId === currentUserId
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-[hsl(var(--muted-foreground))]"
                          }`}
                        >
                          <span>
                            <span className="font-medium text-[hsl(var(--foreground))]">{r.rank}등</span>
                            <span className="ml-2">{r.name}</span>
                            {r.userId === currentUserId && (
                              <span className="ml-1 text-xs">(나)</span>
                            )}
                          </span>
                          <span className="text-xs tabular-nums">{formatTime(r.timeSeconds)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">— 순위 없음 (아직 제출한 사람 없음)</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] py-8 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">이번 주 코딩 문제가 없어요.</p>
            <Link
              href="/battles/coding"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-amber-400 transition-colors"
            >
              💻 문제 추가하고 경기 시작하기
            </Link>
          </div>
        )}
      </section>

      {/* 운동배틀 */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-transparent p-4 sm:p-6 shadow-lg shadow-black/5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <span aria-hidden>🏃</span> 운동배틀
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{weekLabel}</p>
        </div>

        <WorkoutBattleForm onAdded={fetchWorkoutMatches} />

        {workoutMatches.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">배틀 기록</h3>
            <ul className="space-y-2">
              {workoutMatches.map((m) => (
                <li
                  key={m.id}
                  className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{m.sport}</span>
                  <span className="mx-1.5 text-[hsl(var(--muted-foreground))]">·</span>
                  <span className="text-[hsl(var(--foreground))]">{m.participantA}</span>
                  <span className="mx-1 text-[hsl(var(--muted-foreground))]">vs</span>
                  <span className="text-[hsl(var(--foreground))]">{m.participantB}</span>
                  <span className="mx-1.5 text-[hsl(var(--muted-foreground))]">→</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{m.result}</span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {new Date(m.createdAt).toLocaleString("ko-KR")} · 기록: {m.recordedByName}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-[hsl(var(--border))] py-6 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">배틀 기록을 추가하면 여기에 표시됩니다.</p>
          </div>
        )}
      </section>
    </div>
  );
}
