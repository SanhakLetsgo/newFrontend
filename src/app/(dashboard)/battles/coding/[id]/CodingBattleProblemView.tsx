"use client";

import { useState, useEffect, useCallback } from "react";
import { PSCodeEditor } from "@/app/(dashboard)/ps/PSCodeEditor";

type Problem = {
  id: string;
  title: string;
  description: string;
  referenceCode: string | null;
  referenceLanguage: string;
  creatorName: string;
};
type Submission = {
  code: string;
  language: string;
  startedAt: string | null;
  completedAt: string | null;
};
type RankingRow = { rank: number; userId: string; name: string; timeSeconds: number | null; completedAt: string | null };

export function CodingBattleProblemView({
  problem,
  initialSubmission,
  currentUserId,
}: {
  problem: Problem;
  initialSubmission: Submission | null;
  currentUserId: string;
}) {
  const [code, setCode] = useState(initialSubmission?.code ?? "");
  const [language, setLanguage] = useState(initialSubmission?.language ?? "cpp");
  const [startedAt, setStartedAt] = useState<string | null>(initialSubmission?.startedAt ?? null);
  const [completedAt, setCompletedAt] = useState<string | null>(initialSubmission?.completedAt ?? null);
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureStarted = useCallback(() => {
    if (startedAt) return;
    fetch(`/api/battles/coding/problems/${problem.id}/submission`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s: { startedAt: string }) => {
        setStartedAt(s.startedAt ?? null);
      })
      .catch(() => {});
  }, [problem.id, startedAt]);

  const fetchRankings = useCallback(() => {
    fetch(`/api/battles/coding/problems/${problem.id}/rankings`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { rankings: RankingRow[] }) => setRankings(data.rankings ?? []))
      .catch(() => {});
  }, [problem.id]);

  useEffect(() => {
    if (!initialSubmission) {
      ensureStarted();
    }
    fetchRankings();
  }, [initialSubmission, ensureStarted, fetchRankings]);

  const saveDraft = () => {
    setError(null);
    setSaving(true);
    fetch(`/api/battles/coding/problems/${problem.id}/submission`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, language }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("저장 실패"))))
      .then(() => fetchRankings())
      .catch((e) => setError(e.message ?? "저장 실패"))
      .finally(() => setSaving(false));
  };

  const submitComplete = () => {
    if (completedAt) return;
    setError(null);
    setCompleting(true);
    ensureStarted();
    fetch(`/api/battles/coding/problems/${problem.id}/submission`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, language, complete: true }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "제출 실패");
        return data;
      })
      .then((s: { completedAt: string }) => {
        setCompletedAt(s.completedAt ?? null);
        fetchRankings();
      })
      .catch((e) => setError(e.message ?? "제출 실패"))
      .finally(() => setCompleting(false));
  };

  const formatTime = (sec: number | null) => {
    if (sec == null) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}분 ${s}초`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
      <div className="min-w-0 space-y-6">
        <article className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 sm:p-6">
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">{problem.title}</h1>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">출제: {problem.creatorName}</p>
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            제출 시 테스트 케이스로 C++ 코드가 검증됩니다. stdin에서 입력을 읽고 stdout에 결과를 출력하는 형태로 작성하세요. 모두 통과해야 제출 완료되며, 실행 시간이 짧을수록 상위 순위입니다.
          </p>
          <div className="mt-4 whitespace-pre-wrap text-sm text-[hsl(var(--foreground))] leading-relaxed">
            {problem.description || "설명 없음"}
          </div>
        </article>

        {problem.referenceCode && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 sm:p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">참고 코드</h3>
            <PSCodeEditor
              value={problem.referenceCode}
              onChange={() => {}}
              language={problem.referenceLanguage}
              onLanguageChange={() => {}}
              minHeight="200px"
              readOnly
            />
          </div>
        )}

        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/60 p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-amber-400/90">내 코드</span>
            {startedAt && !completedAt && (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                시작: {new Date(startedAt).toLocaleString("ko-KR")}
              </span>
            )}
            {completedAt && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                제출 완료
              </span>
            )}
          </div>
          <PSCodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            minHeight="320px"
            placeholder="// 코드를 작성하세요"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            >
              {saving ? "저장 중…" : "임시 저장"}
            </button>
            {!completedAt && (
              <button
                type="button"
                onClick={submitComplete}
                disabled={completing}
                className="rounded-xl bg-amber-500 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
              >
                {completing ? "제출 중…" : "제출 완료 (순위 반영)"}
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>

      {rankings.length > 0 && (
        <div className="lg:order-none">
          <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 sticky top-24">
            <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-3">순위</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
              제출 완료한 순서 + 걸린 시간
            </p>
            <ul className="space-y-2">
              {rankings.map((r) => (
                <li
                  key={r.userId}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    r.userId === currentUserId
                      ? "border-amber-500/40 bg-amber-500/15"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30"
                  }`}
                >
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {r.rank}등 {r.name}
                    {r.userId === currentUserId && " (나)"}
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatTime(r.timeSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
