"use client";

import { useState, useEffect, useCallback } from "react";
import { PSCodeEditor } from "./PSCodeEditor";
import type { PsCodePost } from "@/app/(dashboard)/ps/ps-types";

type CommentRow = {
  id: string;
  content: string;
  code: string | null;
  language: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
};

export function PSCodeViewModal({
  post,
  currentUserId,
  onClose,
}: {
  post: PsCodePost;
  currentUserId: string;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentCode, setCommentCode] = useState("");
  const [commentCodeLang, setCommentCodeLang] = useState("javascript");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [viewingCommentCode, setViewingCommentCode] = useState<{ code: string; language: string; userName: string } | null>(null);

  const canDeleteComment = (comment: CommentRow) =>
    post.userId === currentUserId || comment.user?.id === currentUserId;

  const deleteComment = async (commentId: string) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ps/code/${post.id}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } finally {
      setBusy(false);
    }
  };

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/ps/code/${post.id}/comments`, { credentials: "include" });
    if (res.ok) {
      const list = await res.json();
      setComments(Array.isArray(list) ? list : []);
      setLoadErr(null);
    } else {
      setLoadErr("댓글을 불러올 수 없습니다.");
    }
  }, [post.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const body: { content: string; code?: string; language?: string } = {
        content: commentText.trim(),
      };
      if (commentCode.trim()) {
        body.code = commentCode.trim();
        body.language = commentCodeLang;
      }
      const res = await fetch(`/api/ps/code/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
        setCommentCode("");
        setCommentCodeLang("javascript");
        setShowCodeInput(false);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-view-modal-title"
    >
      <div
        className="relative flex flex-col w-full max-w-[calc(100vw-1.5rem)] sm:max-w-4xl min-h-[85dvh] max-h-[95dvh] rounded-2xl border border-white/20 bg-zinc-900 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 border-b border-white/10 bg-zinc-800/80 px-5 py-3">
          <h2 id="code-view-modal-title" className="text-lg font-semibold text-zinc-100">
            {post.kind === "solution" ? "정답 코드 전체보기" : "피드백 원하는 코드 전체보기"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-sm font-medium text-zinc-300">
                {post.user?.name ?? "이름 없음"}
              </span>
              {post.title && (
                <span className="text-sm text-zinc-500">{post.title}</span>
              )}
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-500">
                {post.language}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <PSCodeEditor
                value={post.code}
                readOnly
                language={post.language}
                minHeight="560px"
              />
            </div>
            {post.question?.trim() && (
              <div className="mt-3 rounded-xl border border-white/10 bg-zinc-800/50 px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">추가 질문</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {post.question.trim()}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-5">
            <h3 className="text-base font-semibold text-zinc-200 mb-3">댓글 ({comments.length})</h3>
            {loadErr && (
              <p className="text-sm text-red-400 mb-3">{loadErr}</p>
            )}
            <ul className="space-y-3 mb-5">
              {comments.length === 0 && !loadErr ? (
                <li className="text-sm text-zinc-500 py-4">아직 댓글이 없어요.</li>
              ) : (
                comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-300">
                          {c.user?.name ?? "이름 없음"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(c.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      {canDeleteComment(c) && (
                        <button
                          type="button"
                          onClick={() => deleteComment(c.id)}
                          disabled={busy}
                          className="text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap">{c.content}</p>
                    {c.code?.trim() && (
                      <div className="mt-3">
                        <div className="rounded-lg border border-white/10 overflow-hidden">
                          <PSCodeEditor
                            value={c.code}
                            readOnly
                            language={c.language ?? "javascript"}
                            minHeight="120px"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingCommentCode({ code: c.code!, language: c.language ?? "javascript", userName: c.user?.name ?? "이름 없음" })}
                          className="mt-1.5 text-xs text-amber-400 hover:text-amber-300"
                        >
                          전체보기
                        </button>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
            <div className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="피드백이나 코멘트를 남겨보세요"
                rows={2}
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/50 focus:outline-none resize-y min-h-[60px]"
              />
              {showCodeInput ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">댓글에 넣을 코드 (선택)</span>
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      코드 제거
                    </button>
                  </div>
                  <div className="rounded-xl border border-white/10 overflow-hidden">
                    <PSCodeEditor
                      value={commentCode}
                      onChange={setCommentCode}
                      language={commentCodeLang}
                      onLanguageChange={setCommentCodeLang}
                      placeholder="// 코드를 입력하세요"
                      minHeight="160px"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCodeInput(true)}
                  className="text-xs text-amber-400 hover:text-amber-300"
                >
                  + 코드도 함께 보내기
                </button>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={busy || !commentText.trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                >
                  {busy ? "등록 중…" : "댓글 등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 코드 전체보기 모달 */}
      {viewingCommentCode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setViewingCommentCode(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-code-fullview-title"
        >
          <div
            className="relative w-full max-w-2xl max-h-[85dvh] rounded-2xl border border-white/20 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 border-b border-white/10 bg-zinc-800/80 px-4 py-3">
              <h3 id="comment-code-fullview-title" className="text-sm font-semibold text-zinc-200">
                {viewingCommentCode.userName}님 댓글 코드 전체보기
              </h3>
              <button
                type="button"
                onClick={() => setViewingCommentCode(null)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <PSCodeEditor
                  value={viewingCommentCode.code}
                  readOnly
                  language={viewingCommentCode.language}
                  minHeight="400px"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
