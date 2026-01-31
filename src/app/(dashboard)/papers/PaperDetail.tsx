"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null };
};

type Paper = {
  id: string;
  title: string;
  url: string | null;
  tags: string[];
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

  return (
    <>
      <section className="rounded-xl border border-[hsl(var(--border))] p-4 mb-4">
        <h1 className="text-lg font-semibold mb-2">{paper.title}</h1>
        {paper.user?.name && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">등록: {paper.user.name}</p>
        )}
        <dl className="text-sm space-y-1 text-[hsl(var(--muted-foreground))]">
          <div>
            <dt className="inline font-medium text-[hsl(var(--foreground))]">링크 </dt>
            <dd className="inline">
              {paper.url ? (
                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                  {paper.url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {paper.pdfPath && (
            <div>
              <dt className="inline font-medium text-[hsl(var(--foreground))]">논문 PDF </dt>
              <dd className="inline">
                <a href={paper.pdfPath} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                  PDF 보기
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-[hsl(var(--foreground))]">태그 </dt>
            <dd className="inline">{paper.tags.length ? paper.tags.join(", ") : "—"}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-[hsl(var(--foreground))]">읽은 날짜 </dt>
            <dd className="inline">{paper.readAt}</dd>
          </div>
        </dl>
      </section>

      {paper.mySummary && (
        <section className="rounded-xl border border-[hsl(var(--border))] p-4 mb-4">
          <h2 className="text-base font-semibold mb-2">나만의 정리</h2>
          <div className="text-sm whitespace-pre-wrap">{paper.mySummary}</div>
        </section>
      )}

      <section className="rounded-xl border border-[hsl(var(--border))] p-4">
        <h2 className="text-base font-semibold mb-3">내 리뷰</h2>
        {editing ? (
          <form onSubmit={saveReview} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">한줄요약 (1문장)</label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={2}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">핵심 기여 (3줄 이내)</label>
              <textarea
                value={form.contribution}
                onChange={(e) => setForm((f) => ({ ...f, contribution: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">방법/모델 (자유)</label>
              <textarea
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">실험/결과 (자유)</label>
              <textarea
                value={form.experiment}
                onChange={(e) => setForm((f) => ({ ...f, experiment: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">한계/의문점 (자유)</label>
              <textarea
                value={form.limitation}
                onChange={(e) => setForm((f) => ({ ...f, limitation: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">내 아이디어/후속 실험 (자유)</label>
              <textarea
                value={form.idea}
                onChange={(e) => setForm((f) => ({ ...f, idea: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                저장
              </button>
              {paper.review && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        ) : (
          <>
            {paper.review ? (
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">한줄요약</h3>
                  <p className="whitespace-pre-wrap">{paper.review.summary || "—"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">핵심 기여</h3>
                  <p className="whitespace-pre-wrap">{paper.review.contribution || "—"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">방법/모델</h3>
                  <p className="whitespace-pre-wrap">{paper.review.method || "—"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">실험/결과</h3>
                  <p className="whitespace-pre-wrap">{paper.review.experiment || "—"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">한계/의문점</h3>
                  <p className="whitespace-pre-wrap">{paper.review.limitation || "—"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-[hsl(var(--muted-foreground))]">내 아이디어/후속 실험</h3>
                  <p className="whitespace-pre-wrap">{paper.review.idea || "—"}</p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-3 rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
            >
              {paper.review ? "수정" : "리뷰 작성"}
            </button>
          </>
        )}
      </section>

      <PaperComments paperId={paper.id} initialComments={paper.comments ?? []} />
    </>
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
    <section className="rounded-xl border border-[hsl(var(--border))] p-4">
      <h2 className="text-base font-semibold mb-3">댓글 ({comments.length})</h2>
      <ul className="space-y-3 mb-4">
        {comments.length === 0 ? (
          <li className="text-sm text-[hsl(var(--muted-foreground))]">아직 댓글이 없습니다.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="border-b border-[hsl(var(--border))] pb-3 last:border-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{c.user?.name ?? "알 수 없음"}</p>
              <p className="text-sm whitespace-pre-wrap mt-1">{c.content}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {new Date(c.createdAt).toLocaleString("ko-KR")}
              </p>
            </li>
          ))
        )}
      </ul>
      <form onSubmit={submitComment} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="참여자로서 댓글을 남겨보세요"
          rows={3}
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          maxLength={2000}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          댓글 등록
        </button>
      </form>
    </section>
  );
}
