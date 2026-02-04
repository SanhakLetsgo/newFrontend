"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TestCaseRow = { input: string; expectedOutput: string };

type Problem = {
  id: string;
  title: string;
  description: string;
  referenceCode: string | null;
  referenceLanguage: string;
  testCases?: TestCaseRow[];
  creatorName: string;
  createdAt: string;
};

const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export function CodingBattleProblemsView() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addLanguage, setAddLanguage] = useState("javascript");
  const [addTestCases, setAddTestCases] = useState<TestCaseRow[]>([{ input: "", expectedOutput: "" }]);
  const [adding, setAdding] = useState(false);

  const fetchProblems = () => {
    fetch("/api/battles/coding/problems", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("로드 실패"))))
      .then(setProblems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/battles/coding/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: addTitle.trim(),
          description: addDescription.trim(),
          referenceCode: addCode.trim() || undefined,
          referenceLanguage: addLanguage,
          testCases: addTestCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim()).map((tc) => ({ input: tc.input.trim(), expectedOutput: tc.expectedOutput.trim() })),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setProblems((prev) => [...prev, created]);
        setAddTitle("");
        setAddDescription("");
        setAddCode("");
        setAddLanguage("javascript");
        setAddTestCases([{ input: "", expectedOutput: "" }]);
        setShowAdd(false);
      } else {
        const data = await res.json();
        setError(data.error ?? "추가 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">이번 주 문제</h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-xl bg-amber-500 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-amber-400 transition-colors"
        >
          {showAdd ? "취소" : "+ 문제 추가"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
              제목
            </label>
            <input
              type="text"
              value={addTitle}
              onChange={(e) => setAddTitle(e.target.value)}
              placeholder="문제 제목"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
              설명 (선택)
            </label>
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="문제 조건, 입출력 예시 등"
              rows={4}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
              테스트 케이스 (제출 검증용, C++)
            </label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
              입력과 기대 출력을 넣으면 제출 시 C++ 코드가 검증됩니다. stdin으로 입력, stdout으로 출력하는 형태입니다. 모두 통과해야 제출 완료되며, 실행 시간이 짧을수록 상위 순위입니다.
            </p>
            {addTestCases.map((tc, idx) => (
              <div key={idx} className="flex flex-wrap gap-2 mb-2 items-start rounded-lg border border-[hsl(var(--border))] p-2 bg-[hsl(var(--background))]/50">
                <input
                  type="text"
                  value={tc.input}
                  onChange={(e) => {
                    const next = [...addTestCases];
                    next[idx] = { ...next[idx], input: e.target.value };
                    setAddTestCases(next);
                  }}
                  placeholder="입력 (예: 1 2)"
                  className="flex-1 min-w-[80px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm font-mono"
                />
                <span className="text-[hsl(var(--muted-foreground))] self-center">→</span>
                <input
                  type="text"
                  value={tc.expectedOutput}
                  onChange={(e) => {
                    const next = [...addTestCases];
                    next[idx] = { ...next[idx], expectedOutput: e.target.value };
                    setAddTestCases(next);
                  }}
                  placeholder="기대 출력 (예: 3)"
                  className="flex-1 min-w-[80px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setAddTestCases((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-600 text-sm"
                  aria-label="삭제"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAddTestCases((prev) => [...prev, { input: "", expectedOutput: "" }])}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              + 테스트 케이스 추가
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">
              참고 코드 (선택)
            </label>
            <div className="flex gap-2 mb-1">
              <select
                value={addLanguage}
                onChange={(e) => setAddLanguage(e.target.value)}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-sm"
              >
                {CODE_LANGUAGES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              placeholder="정답 코드, 참고용 코드 등을 입력하세요"
              rows={10}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm font-mono resize-y"
              spellCheck={false}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={adding}
            className="rounded-xl bg-amber-500 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
          >
            {adding ? "추가 중…" : "추가"}
          </button>
        </form>
      )}

      {error && !showAdd && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {problems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">이번 주 문제가 없어요.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-xl bg-amber-500 text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-amber-400"
          >
            첫 문제 추가하기
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {problems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/battles/coding/${p.id}`}
                className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors"
              >
                <span className="font-medium text-[hsl(var(--foreground))]">{p.title}</span>
                <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">
                  출제: {p.creatorName}
                </span>
                <span className="block mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                  풀기 →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
