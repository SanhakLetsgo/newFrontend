"use client";

import { useState } from "react";
import { PSCodeEditor } from "./PSCodeEditor";

type Post = {
  id: string;
  kind: string;
  title: string | null;
  author: string | null;
  code: string;
  language: string;
  question: string | null;
  user: { id: string; name: string | null } | null;
};

export function PSCodeAccordionList({
  posts,
  sectionTitle,
  emptyMessage = "아직 없어요.",
}: {
  posts: Post[];
  sectionTitle: string;
  emptyMessage?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-200">{sectionTitle}</h2>
        <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-zinc-200">{sectionTitle}</h2>
      <ul className="space-y-1">
        {posts.map((post) => {
          const isOpen = openId === post.id;
          const label = [post.title || "제목 없음", post.user?.name ?? post.author ?? "이름 없음"]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={post.id}
              className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : post.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-transparent"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-zinc-200 truncate flex-1">
                  {label}
                </span>
                <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-500">
                  {post.language}
                </span>
                <span
                  className="shrink-0 text-zinc-500 text-xs transition-transform"
                  aria-hidden
                >
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-white/10">
                  <div className="p-3 bg-zinc-900/80">
                    <PSCodeEditor
                      value={post.code}
                      readOnly
                      language={post.language}
                      minHeight="360px"
                    />
                  </div>
                  {post.question?.trim() ? (
                    <div className="border-t border-white/10 px-4 py-3 bg-zinc-800/30">
                      <p className="text-xs text-zinc-500 mb-1">추가 질문</p>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {post.question.trim()}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
