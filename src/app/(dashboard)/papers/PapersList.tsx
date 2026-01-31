"use client";

import Link from "next/link";

type Paper = {
  id: string;
  title: string;
  url: string | null;
  tags: string[];
  readAt: string;
  review: { id: string } | null;
  user?: { name: string | null };
};

export function PapersList({ papers }: { papers: Paper[] }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
              <th className="text-left p-3 font-medium">참여자</th>
              <th className="text-left p-3 font-medium">제목</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">링크</th>
              <th className="text-left p-3 font-medium">태그</th>
              <th className="text-left p-3 font-medium">읽은 날짜</th>
              <th className="text-left p-3 font-medium">리뷰</th>
            </tr>
          </thead>
          <tbody>
            {papers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[hsl(var(--muted-foreground))]">
                  등록된 논문이 없습니다.
                </td>
              </tr>
            ) : (
              papers.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                >
                  <td className="p-3">{p.user?.name ?? "—"}</td>
                  <td className="p-3">
                    <Link href={`/papers/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="p-3 hidden sm:table-cell max-w-[12rem] truncate">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate block">
                        {p.url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {p.tags.length ? p.tags.join(", ") : "—"}
                    </span>
                  </td>
                  <td className="p-3">{p.readAt}</td>
                  <td className="p-3">{p.review ? "있음" : "없음"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
