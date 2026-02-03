"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: Date | string;
  user: { name: string | null };
};

type Paper = {
  id: string;
  title: string;
  url: string | null;
  tags: string[];
  authors: string[];
  readAt: string;
  pdfPath: string | null;
  mySummary: string | null;
  user?: { name: string | null };
  review: {
    id: string;
    summary: string | null;
    contribution: string | null;
    method: string | null;
    experiment: string | null;
    limitation: string | null;
    idea: string | null;
  } | null;
  comments?: Comment[];
};

export function PaperDetail({ paper }: { paper: Paper }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!paper.review);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    summary: paper.review?.summary ?? "",
    contribution: paper.review?.contribution ?? "",
    method: paper.review?.method ?? "",
    experiment: paper.review?.experiment ?? "",
    limitation: paper.review?.limitation ?? "",
    idea: paper.review?.idea ?? "",
  });

  const removeAuthor = async (index: number) => {
    const next = (paper.authors ?? []).filter((_, i) => i !== index);
    setBusy(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ authors: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const saveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/papers/${paper.id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const reviewSections = paper.review
    ? [
        { key: "summary", label: "한줄요약", value: paper.review.summary },
        { key: "contribution", label: "핵심 기여", value: paper.review.contribution },
        { key: "method", label: "방법/모델", value: paper.review.method },
        { key: "experiment", label: "실험/결과", value: paper.review.experiment },
        { key: "limitation", label: "한계/의문점", value: paper.review.limitation },
        { key: "idea", label: "내 아이디어/후속 실험", value: paper.review.idea },
      ]
    : [];

  return (
    <article className="max-w-3xl mx-auto">
      {/* 북커버 스타일: 논문 정보 */}
      <header className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur-sm p-6 sm:p-8 mb-8 shadow-lg shadow-black/5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight leading-tight mb-4">
          {paper.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[hsl(var(--muted-foreground))] mb-4">
          {(paper.authors?.length ?? 0) > 0 && (
            <span>저자: {(paper.authors ?? []).join(", ")}</span>
          )}
          <span>읽은 날짜 {paper.readAt}</span>
          {paper.user?.name && <span>등록: {paper.user.name}</span>}
        </div>
        {paper.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {paper.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {paper.pdfPath && (
            <a
              href={paper.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              <span aria-hidden>📄</span> PDF 읽기
            </a>
          )}
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <span aria-hidden>🔗</span> 원문 링크
            </a>
          )}
        </div>
        {(paper.authors?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">글쓴이 수정:</span>
            {(paper.authors ?? []).map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeAuthor(i)}
                  disabled={busy}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50 ml-0.5"
                  aria-label="글쓴이 삭제"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 나만의 정리: 독서 노트 스타일 */}
      {paper.mySummary && (
        <section className="rounded-2xl border-l-4 border-violet-500/50 bg-[hsl(var(--muted))]/30 p-6 sm:p-8 mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400/90 mb-3">
            나만의 정리
          </h2>
          <div className="text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">
            {paper.mySummary}
          </div>
        </section>
      )}

      {/* 내 리뷰: 북리뷰 스타일 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 p-6 sm:p-8 mb-8">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-6 pb-2 border-b border-[hsl(var(--border))]">
          내 리뷰
        </h2>
        {editing ? (
          <form onSubmit={saveReview} className="space-y-5">
            {[
              { key: "summary", label: "한줄요약 (1문장)", rows: 2 },
              { key: "contribution", label: "핵심 기여 (3줄 이내)", rows: 3 },
              { key: "method", label: "방법/모델", rows: 3 },
              { key: "experiment", label: "실험/결과", rows: 3 },
              { key: "limitation", label: "한계/의문점", rows: 3 },
              { key: "idea", label: "내 아이디어/후속 실험", rows: 3 },
            ].map(({ key, label, rows }) => (
              <div key={key} className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  {label}
                </label>
                <textarea
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  rows={rows}
                  className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                저장
              </button>
              {paper.review && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        ) : (
          <>
            {reviewSections.length > 0 ? (
              <div className="space-y-0">
                {reviewSections.map(({ key, label, value }) => (
                  <div
                    key={key}
                    className="py-5 border-b border-[hsl(var(--border))]/70 last:border-0 last:pb-0 first:pt-0"
                  >
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
                      {label}
                    </h3>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap text-[15px]">
                      {value && value.trim() ? value : "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-4 py-2.5 text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors"
            >
              {paper.review ? "리뷰 수정" : "리뷰 작성"}
            </button>
          </>
        )}
      </section>

      <PaperComments paperId={paper.id} initialComments={paper.comments ?? []} />
    </article>
  );
}

function PaperComments({ paperId, initialComments }: { paperId: string; initialComments: Comment[] }) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/papers/${paperId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setContent("");
        router.refresh();
        setComments((prev) => [...prev, data]);
      } else {
        setError(data.error?.content?.[0] ?? data.error ?? "댓글 등록 실패");
      }
    } catch {
      setError("연결 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
        댓글 ({comments.length})
      </h2>
      <ul className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <li className="text-sm text-[hsl(var(--muted-foreground))] py-4">아직 댓글이 없습니다.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="py-4 border-b border-[hsl(var(--border))]/70 last:border-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{c.user?.name ?? "알 수 없음"}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2 text-[hsl(var(--foreground))]">{c.content}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                {new Date(c.createdAt).toLocaleString("ko-KR")}
              </p>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={submitComment} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="참여자로서 댓글을 남겨보세요"
          rows={3}
          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]"
          maxLength={2000}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          댓글 등록
        </button>
      </form>
    </section>
  );
}
