"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  userId: string;
  addedByName: string;
  targetName: string;
  count: number;
  weight: number;
  memo: string | null;
  createdAt: string;
};

export function WarningView({ currentUserId }: { currentUserId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetName, setTargetName] = useState("");
  const [weight, setWeight] = useState(100);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedTargetName, setSelectedTargetName] = useState<string | null>(null);

  const fetchEntries = () => {
    fetch("/api/warning", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("로드 실패"))))
      .then((data: { entries: Entry[] }) => setEntries(data.entries ?? []))
      .catch((e) => setError(e.message ?? "로드 실패"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const name = targetName.trim();
    if (!name) {
      setAddError("대상 이름을 입력해 주세요.");
      return;
    }
    const weightNum = Math.round(Number(weight));
    const w = Number.isFinite(weightNum) && weightNum >= 0 && weightNum <= 100 ? weightNum : 100;
    setSubmitting(true);
    try {
      const r = await fetch("/api/warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetName: name, weight: w, memo: memo.trim() || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "추가 실패");
      const newEntry = data as Entry;
      setEntries((prev) => [newEntry, ...prev]);
      setTargetName("");
      setWeight(100);
      setMemo("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const rankByTotal = (() => {
    const map = new Map<string, { total: number; weighted: number }>();
    for (const e of entries) {
      const cur = map.get(e.targetName) ?? { total: 0, weighted: 0 };
      cur.total += e.count;
      cur.weighted += e.count * (e.weight / 100);
      map.set(e.targetName, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, total: v.total, weighted: Math.round(v.weighted * 10) / 10 }))
      .sort((a, b) => b.weighted - a.weighted || b.total - a.total);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
        <span className="animate-pulse">로딩 중…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-500/40 bg-red-500/10 px-6 py-4 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 추가 폼: 횟수 + 가중치(100% 만점) */}
      <section className="rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 via-transparent to-amber-500/10 p-5 sm:p-6 shadow-xl shadow-red-500/10">
        <h2 className="text-base font-bold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
          <span className="text-xl">➕</span> 경고 추가하기
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">대상 이름</span>
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="예: 홍길동"
              className="mt-1 w-full rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">가중치 (0~100%)</span>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]/80 mt-0.5 mb-2">순위에 반영됩니다. 100%=전부, 50%=절반</p>
            <div className="rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 focus-within:border-red-500/50 focus-within:ring-2 focus-within:ring-red-500/20 transition-[border-color,box-shadow]">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="h-2.5 flex-1 accent-red-500 min-w-0"
                />
                <span className="w-14 shrink-0 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 py-1.5 text-center font-mono text-sm font-semibold tabular-nums text-[hsl(var(--foreground))]">
                  {weight}%
                </span>
              </div>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">사유 (선택)</span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="나중에 이름 클릭하면 이력에서 보임"
              className="mt-1 w-full rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition hover:from-red-600 hover:to-rose-700 disabled:opacity-50"
            >
              {submitting ? "추가 중…" : "경고판에 올리기"}
            </button>
            {addError && <span className="text-sm text-red-500">{addError}</span>}
          </div>
        </form>
      </section>

      {/* 기만자 순위 (총 횟수) - 화려하게 */}
      {rankByTotal.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/15 via-orange-500/10 to-transparent p-5 sm:p-6 shadow-xl shadow-amber-500/10">
          <div className="mb-4 flex items-center gap-3 border-b-2 border-amber-500/25 pb-3">
            <span className="text-3xl" aria-hidden>🏆</span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[hsl(var(--foreground))]">기만자 순위</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">순위 기준: 가중치 반영 점수 (높을수록 위). 동점이면 받은 경고 횟수로 순서 결정</p>
            </div>
          </div>
          <ul className="space-y-3">
            {rankByTotal.map((r, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              return (
                <li
                  key={r.name}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 p-4 shadow-lg transition hover:shadow-xl ${
                    i === 0
                      ? "border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-yellow-500/15 shadow-amber-500/20"
                      : i === 1
                        ? "border-slate-400/40 bg-gradient-to-r from-slate-500/20 to-zinc-500/10"
                        : i === 2
                          ? "border-amber-700/40 bg-gradient-to-r from-amber-700/20 to-amber-800/10"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--card))]/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 text-xl font-black tabular-nums">
                      {medal ?? i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTargetName(r.name)}
                      className="text-lg font-bold text-[hsl(var(--foreground))] underline decoration-amber-500/50 underline-offset-2 hover:decoration-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 rounded truncate"
                    >
                      {r.name}
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 px-4 py-2 font-black text-lg text-white tabular-nums shadow-lg shadow-red-500/30">
                      {r.weighted}점
                    </span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      경고 <span className="font-mono font-bold text-[hsl(var(--foreground))]">{r.total}</span>회
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 경고판 리스트 (최근 기록) */}
      <section className="rounded-2xl border-2 border-red-500/25 bg-gradient-to-b from-red-500/5 to-transparent p-4 sm:p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 border-b-2 border-red-500/20 pb-3">
          <span className="text-3xl" aria-hidden>⚠️</span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-[hsl(var(--foreground))]">경고판 (최근 기록)</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">이름 클릭 시 경고 이력 보기</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-red-500/20 bg-red-500/5 py-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">아직 올라온 경고가 없어요. 위에서 첫 경고를 올려보세요.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((e, index) => (
              <li
                key={e.id}
                className="group relative overflow-hidden rounded-xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-4 shadow-lg transition hover:shadow-xl hover:border-red-500/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded-lg bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[hsl(var(--muted-foreground))]">
                        #{entries.length - index}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTargetName(e.targetName)}
                        className="text-lg font-bold text-[hsl(var(--foreground))] underline decoration-red-500/40 underline-offset-2 hover:decoration-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 rounded"
                      >
                        {e.targetName}
                      </button>
                      {e.userId === currentUserId && (
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          내가 올림
                        </span>
                      )}
                    </div>
                    {e.memo && (
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">&ldquo;{e.memo}&rdquo;</p>
                    )}
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      by {e.addedByName} · {new Date(e.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 font-black text-lg text-white tabular-nums shadow-lg shadow-red-500/20">
                      {e.count}회
                    </span>
                    <span className="rounded-xl bg-[hsl(var(--muted))]/50 px-2.5 py-1 font-mono text-sm font-bold tabular-nums">
                      {e.weight}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 대상별 경고 이력 모달 */}
      {selectedTargetName && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTargetName(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="warning-history-title"
        >
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border-2 border-red-500/30 bg-[hsl(var(--background))] shadow-2xl shadow-red-500/20"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-red-500/20 bg-[hsl(var(--card))]/95 px-4 py-3 backdrop-blur">
              <h3 id="warning-history-title" className="text-lg font-bold text-[hsl(var(--foreground))]">
                ⚠️ {selectedTargetName} 경고 이력
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTargetName(null)}
                className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-red-500/50"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 max-h-[calc(85vh-60px)]">
              {(() => {
                const history = entries
                  .filter((e) => e.targetName === selectedTargetName)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                if (history.length === 0) {
                  return (
                    <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      해당 이름의 경고 이력이 없습니다.
                    </p>
                  );
                }
                return (
                  <ul className="space-y-3">
                    {history.map((e) => (
                      <li
                        key={e.id}
                        className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">
                            {new Date(e.createdAt).toLocaleDateString("ko-KR")} · {new Date(e.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="rounded-lg bg-red-500/20 px-2 py-0.5 font-mono text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                              {e.count}회
                            </span>
                            <span className="rounded-lg bg-[hsl(var(--muted))] px-2 py-0.5 font-mono text-xs tabular-nums">
                              가중치 {e.weight}%
                            </span>
                          </span>
                        </div>
                        {e.memo ? (
                          <p className="mt-2 text-sm text-[hsl(var(--foreground))]">사유: {e.memo}</p>
                        ) : (
                          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">사유: —</p>
                        )}
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">올린 사람: {e.addedByName}</p>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
