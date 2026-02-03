"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PSCodeEditor } from "./PSCodeEditor";
import type { PsTopic, PsCodePost } from "./ps-types";

export function PSTopicsView({ initialTopics }: { initialTopics: PsTopic[] }) {
  const router = useRouter();
  const [topics, setTopics] = useState<PsTopic[]>(initialTopics);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<"subject" | "lesson">("subject");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [codeByTopic, setCodeByTopic] = useState<Record<string, PsCodePost[]>>({});
  const [addingCode, setAddingCode] = useState<{
    topicId: string;
    kind: "solution" | "feedback";
  } | null>(null);
  const [codeTitle, setCodeTitle] = useState("");
  const [codeBody, setCodeBody] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");

  const fetchCodeForTopic = useCallback(async (topicId: string) => {
    const res = await fetch(`/api/ps/topics/${topicId}/code`, { credentials: "include" });
    if (res.ok) {
      const list = await res.json();
      setCodeByTopic((prev) => ({ ...prev, [topicId]: list }));
    }
  }, []);

  const openTopic = useCallback(
    (id: string) => {
      setExpandedId((current) => (current === id ? null : id));
      if (!codeByTopic[id]) fetchCodeForTopic(id);
    },
    [codeByTopic, fetchCodeForTopic]
  );

  const addTopic = async () => {
    if (!newTitle.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ps/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newTitle.trim(), kind: newKind }),
      });
      if (res.ok) {
        const topic = await res.json();
        setTopics((prev) => [topic, ...prev]);
        setNewTitle("");
        setShowAddTopic(false);
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

  const deleteTopic = async (id: string) => {
    if (!confirm("이 주제와 안의 모든 코드를 삭제할까요?")) return;
    const res = await fetch(`/api/ps/topics/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setTopics((prev) => prev.filter((t) => t.id !== id));
      setExpandedId((current) => (current === id ? null : current));
      setCodeByTopic((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.refresh();
    }
  };

  const submitCode = async () => {
    if (!addingCode || !codeBody.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ps/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topicId: addingCode.topicId,
          kind: addingCode.kind,
          title: codeTitle.trim() || undefined,
          code: codeBody,
          language: codeLang,
        }),
      });
      if (res.ok) {
        const post = await res.json();
        setCodeByTopic((prev) => ({
          ...prev,
          [addingCode.topicId]: [post, ...(prev[addingCode.topicId] ?? [])],
        }));
        setAddingCode(null);
        setCodeTitle("");
        setCodeBody("");
        setCodeLang("javascript");
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

  const deleteCode = async (postId: string, topicId: string) => {
    if (!confirm("이 코드를 삭제할까요?")) return;
    const res = await fetch(`/api/ps/code/${postId}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      setCodeByTopic((prev) => ({
        ...prev,
        [topicId]: (prev[topicId] ?? []).filter((p) => p.id !== postId),
      }));
      router.refresh();
    }
  };

  const solutions = (topicId: string) => (codeByTopic[topicId] ?? []).filter((p) => p.kind === "solution");
  const feedbacks = (topicId: string) => (codeByTopic[topicId] ?? []).filter((p) => p.kind === "feedback");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-100">주제 · 수업노트</h2>
        <button
          type="button"
          onClick={() => setShowAddTopic((b) => !b)}
          className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 transition-colors hover:border-amber-500/60 hover:bg-amber-500/20"
        >
          <span className="text-lg leading-none">+</span>
          주제/수업노트 추가
        </button>
      </div>

      {showAddTopic && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl">
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">새 주제 또는 수업노트</h3>
          <div className="mb-4 flex flex-wrap gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="예: DFS/BFS, 2주차 수업 정리"
              className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "subject" | "lesson")}
              className="rounded-lg border border-white/10 bg-zinc-800/80 px-4 py-2.5 text-zinc-200 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="subject">주제</option>
              <option value="lesson">수업노트</option>
            </select>
          </div>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addTopic}
              disabled={busy || !newTitle.trim()}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {busy ? "추가 중…" : "추가"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddTopic(false);
                setNewTitle("");
                setError(null);
              }}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {topics.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/50 py-12 text-center text-zinc-500">
            아직 주제가 없어요. 위에서 + 로 추가해 보세요.
          </p>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-xl"
            >
              <button
                type="button"
                onClick={() => openTopic(topic.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {expandedId === topic.id ? "▼" : "▶"}
                  </span>
                  <span className="font-medium text-zinc-100">{topic.title}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                    {topic.kind === "lesson" ? "수업노트" : "주제"}
                  </span>
                </div>
                <span className="text-sm text-zinc-500">
                  코드 {(topic as PsTopic & { _count?: { codePosts: number } })._count?.codePosts ?? 0}개
                </span>
              </button>

              {expandedId === topic.id && (
                <div className="border-t border-white/10 bg-zinc-950/50 p-5">
                  {/* 정답 코드 */}
                  <Section
                    title="정답 코드"
                    subtitle="모범 풀이·정답 코드를 공유해요"
                    topicId={topic.id}
                    posts={solutions(topic.id)}
                    kind="solution"
                    onAdd={() => setAddingCode({ topicId: topic.id, kind: "solution" })}
                    onDelete={(postId) => deleteCode(postId, topic.id)}
                  />
                  {/* 피드백 원하는 코드 */}
                  <Section
                    title="피드백 원하는 코드"
                    subtitle="리뷰받고 싶은 코드를 올려요"
                    topicId={topic.id}
                    posts={feedbacks(topic.id)}
                    kind="feedback"
                    onAdd={() => setAddingCode({ topicId: topic.id, kind: "feedback" })}
                    onDelete={(postId) => deleteCode(postId, topic.id)}
                  />

                  {addingCode?.topicId === topic.id && (
                    <div className="mt-8 rounded-2xl border border-amber-500/20 bg-zinc-900/80 p-5">
                      <h4 className="mb-4 text-sm font-semibold text-amber-400/90">
                        {addingCode.kind === "solution" ? "정답 코드" : "피드백 요청"} 작성
                      </h4>
                      <input
                        type="text"
                        value={codeTitle}
                        onChange={(e) => setCodeTitle(e.target.value)}
                        placeholder="제목 (선택)"
                        className="mb-4 w-full max-w-md rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                      />
                      <div className="mb-4">
                        <PSCodeEditor
                          value={codeBody}
                          onChange={setCodeBody}
                          language={codeLang}
                          onLanguageChange={setCodeLang}
                          placeholder={
                            addingCode.kind === "solution"
                              ? "// 정답 코드를 붙여넣거나 작성하세요"
                              : "// 피드백 받고 싶은 코드를 올려주세요"
                          }
                          minHeight="280px"
                        />
                      </div>
                      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={submitCode}
                          disabled={busy || !codeBody.trim()}
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                        >
                          {busy ? "올리는 중…" : "올리기"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCode(null);
                            setCodeTitle("");
                            setCodeBody("");
                            setError(null);
                          }}
                          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {expandedId === topic.id && (
                <div className="border-t border-white/10 px-5 pb-3 pt-1">
                  <button
                    type="button"
                    onClick={() => deleteTopic(topic.id)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    주제 삭제
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  topicId,
  posts,
  kind,
  onAdd,
  onDelete,
}: {
  title: string;
  subtitle: string;
  topicId: string;
  posts: PsCodePost[];
  kind: "solution" | "feedback";
  onAdd: () => void;
  onDelete: (postId: string) => void;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
        >
          + 코드 올리기
        </button>
      </div>
      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
          아직 없어요. 위 버튼으로 올려보세요.
        </p>
      ) : (
        <ul className="space-y-5">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-300">
                    {post.user?.name ?? "이름 없음"}
                  </span>
                  {post.title && (
                    <span className="text-xs text-zinc-500">{post.title}</span>
                  )}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-500">
                    {post.language}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="text-xs text-zinc-500 hover:text-red-400"
                >
                  삭제
                </button>
              </div>
              <div className="p-2">
                <PSCodeEditor
                  value={post.code}
                  readOnly
                  language={post.language}
                  minHeight="120px"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
