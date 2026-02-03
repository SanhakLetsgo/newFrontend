"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PSCodeEditor } from "./PSCodeEditor";
import { PSCodeViewModal } from "./PSCodeViewModal";
import type { PsTopic, PsCodePost } from "@/app/(dashboard)/ps/ps-types";

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
  const [editingPost, setEditingPost] = useState<PsCodePost | null>(null);
  const [codeTitle, setCodeTitle] = useState("");
  const [codeAuthor, setCodeAuthor] = useState("");
  const [codeBody, setCodeBody] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");
  const [codeQuestion, setCodeQuestion] = useState("");

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
    if (!confirm("정말로 이 주제(수업노트)와 안의 모든 코드를 삭제하시겠습니까?\n되돌릴 수 없습니다.")) return;
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

  const openEdit = useCallback((post: PsCodePost) => {
    setAddingCode(null);
    setEditingPost(post);
    setCodeTitle(post.title ?? "");
    setCodeAuthor(post.author ?? "");
    setCodeBody(post.code);
    setCodeLang(post.language);
    setCodeQuestion(post.question ?? "");
  }, []);

  const submitCode = async () => {
    const isEdit = editingPost != null;
    if (!isEdit && !addingCode) return;
    if (!codeBody.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const body = {
        title: codeTitle.trim() || undefined,
        author: codeAuthor.trim() || undefined,
        code: codeBody,
        language: codeLang,
        question: codeQuestion.trim() || undefined,
      };
      if (isEdit) {
        const res = await fetch(`/api/ps/code/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const updated = await res.json();
          setCodeByTopic((prev) => ({
            ...prev,
            [editingPost.topicId]: (prev[editingPost.topicId] ?? []).map((p) =>
              p.id === editingPost.id ? updated : p
            ),
          }));
          setEditingPost(null);
          setCodeTitle("");
          setCodeAuthor("");
          setCodeBody("");
          setCodeLang("javascript");
          setCodeQuestion("");
          router.refresh();
        } else {
          const data = await res.json();
          setError(typeof data.error === "string" ? data.error : "수정 실패");
        }
      } else if (addingCode) {
        const res = await fetch("/api/ps/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topicId: addingCode.topicId,
            kind: addingCode.kind,
            ...body,
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
          setCodeAuthor("");
          setCodeBody("");
          setCodeLang("javascript");
          setCodeQuestion("");
          router.refresh();
        } else {
          const data = await res.json();
          setError(typeof data.error === "string" ? data.error : "저장 실패");
        }
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
  const [viewFullPost, setViewFullPost] = useState<PsCodePost | null>(null);

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
              <div className="flex w-full items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-4">
                <button
                  type="button"
                  onClick={() => openTopic(topic.id)}
                  className="flex flex-1 items-center gap-2 sm:gap-3 text-left transition-colors hover:bg-white/5 rounded-lg -m-1 p-1 min-w-0 min-h-[44px]"
                >
                  <span className="text-zinc-500 shrink-0">
                    {expandedId === topic.id ? "▼" : "▶"}
                  </span>
                  <span className="font-medium text-zinc-100 truncate">{topic.title}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-400 shrink-0">
                    {topic.kind === "lesson" ? "수업노트" : "주제"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTopic(topic.id);
                  }}
                  className="shrink-0 text-xs text-zinc-500 hover:text-red-400 transition-colors py-2 px-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  삭제
                </button>
              </div>

              {expandedId === topic.id && (
                <div className="border-t border-white/10 bg-zinc-950/50 p-3 sm:p-5">
                  {/* 정답 코드 */}
                  <Section
                    title="정답 코드"
                    subtitle="모범 풀이·정답 코드를 공유해요"
                    topicId={topic.id}
                    posts={solutions(topic.id)}
                    kind="solution"
                    onAdd={() => {
                      setEditingPost(null);
                      setAddingCode({ topicId: topic.id, kind: "solution" });
                    }}
                    onEdit={openEdit}
                    onDelete={(postId) => deleteCode(postId, topic.id)}
                  />
                  {/* 피드백 원하는 코드 */}
                  <Section
                    title="피드백 원하는 코드"
                    subtitle="리뷰받고 싶은 코드를 올려요"
                    topicId={topic.id}
                    posts={feedbacks(topic.id)}
                    kind="feedback"
                    onAdd={() => {
                      setEditingPost(null);
                      setAddingCode({ topicId: topic.id, kind: "feedback" });
                    }}
                    onEdit={openEdit}
                    onDelete={(postId) => deleteCode(postId, topic.id)}
                    onViewFull={setViewFullPost}
                  />

                  {(addingCode != null && addingCode.topicId === topic.id) ||
                  (editingPost != null && editingPost.topicId === topic.id) ? (
                    <div className="mt-6 sm:mt-8 rounded-2xl border border-amber-500/20 bg-zinc-900/80 p-3 sm:p-5">
                      <h4 className="mb-4 text-sm font-semibold text-amber-400/90">
                        {editingPost
                          ? editingPost.kind === "solution"
                            ? "정답 코드 수정"
                            : "피드백 코드 수정"
                          : addingCode!.kind === "solution"
                            ? "정답 코드 작성"
                            : "피드백 요청 작성"}
                      </h4>
                      <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-xs text-zinc-500">제목 (선택)</label>
                          <input
                            type="text"
                            value={codeTitle}
                            onChange={(e) => setCodeTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
                          />
                        </div>
                        <div className="min-w-0 sm:min-w-[160px]">
                          <label className="mb-1 block text-xs text-zinc-500">작성자 (선택)</label>
                          <input
                            type="text"
                            value={codeAuthor}
                            onChange={(e) => setCodeAuthor(e.target.value)}
                            placeholder="이름 또는 닉네임"
                            className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="mb-1 block text-xs text-zinc-500">코드</label>
                        <PSCodeEditor
                          value={codeBody}
                          onChange={setCodeBody}
                          language={codeLang}
                          onLanguageChange={setCodeLang}
                          placeholder={
                            editingPost
                              ? "// 코드를 수정하세요"
                              : addingCode != null && addingCode.kind === "solution"
                                ? "// 정답 코드를 붙여넣거나 작성하세요"
                                : "// 피드백 받고 싶은 코드를 올려주세요"
                          }
                          minHeight="280px"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="mb-1 block text-xs text-zinc-500">
                          코드 아래 추가 질문 (선택)
                        </label>
                        <textarea
                          value={codeQuestion}
                          onChange={(e) => setCodeQuestion(e.target.value)}
                          placeholder="피드백 받고 싶은 점, 궁금한 점 등을 적어주세요"
                          rows={3}
                          className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none resize-y min-h-[80px]"
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
                          {busy
                            ? editingPost
                              ? "수정 중…"
                              : "올리는 중…"
                            : editingPost
                              ? "수정 완료"
                              : "올리기"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCode(null);
                            setEditingPost(null);
                            setCodeTitle("");
                            setCodeAuthor("");
                            setCodeBody("");
                            setCodeQuestion("");
                            setError(null);
                          }}
                          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {viewFullPost != null && (
        <PSCodeViewModal post={viewFullPost} onClose={() => setViewFullPost(null)} />
      )}
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
  onEdit,
  onDelete,
  onViewFull,
}: {
  title: string;
  subtitle: string;
  topicId: string;
  posts: PsCodePost[];
  kind: "solution" | "feedback";
  onAdd: () => void;
  onEdit?: (post: PsCodePost) => void;
  onDelete: (postId: string) => void;
  onViewFull?: (post: PsCodePost) => void;
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
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-zinc-300">
                    {(post.author?.trim() || post.user?.name) ?? "이름 없음"}
                  </span>
                  {post.title && (
                    <span className="text-xs text-zinc-500">{post.title}</span>
                  )}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-500">
                    {post.language}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(post)}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      수정
                    </button>
                  )}
                  {kind === "feedback" && onViewFull && (
                    <button
                      type="button"
                      onClick={() => onViewFull(post)}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      전체보기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(post.id)}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="p-2">
                <PSCodeEditor
                  value={post.code}
                  readOnly
                  language={post.language}
                  minHeight="120px"
                />
              </div>
              {post.question?.trim() && (
                <div className="border-t border-white/10 px-4 py-3 bg-zinc-800/30">
                  <p className="text-xs text-zinc-500 mb-1">추가 질문</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{post.question.trim()}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
