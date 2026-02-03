"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type PSNote = {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
};

function getClientDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PSNotesView({ initialNotes }: { initialNotes: PSNote[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<PSNote[]>(initialNotes);
  const [selectedDate, setSelectedDate] = useState(getClientDate());
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noteForDate = notes.find((n) => n.date === selectedDate);

  useEffect(() => {
    if (noteForDate) setContent(noteForDate.content);
    else setContent("");
  }, [selectedDate, noteForDate]);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/ps/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: selectedDate, content: content.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setNotes((prev) => {
          const rest = prev.filter((n) => n.date !== selectedDate);
          return [saved, ...rest].sort((a, b) => b.date.localeCompare(a.date));
        });
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">오늘의 정리 노트</h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          날짜를 선택하고 자유롭게 정리하세요. 문제 풀이, 개념 정리, 메모 등 편한 형식으로 써도 됩니다.
        </p>
        <div className="mb-3">
          <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">날짜</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 푼 문제, 배운 개념, 복기할 포인트 등을 자유롭게 적어보세요."
          rows={12}
          className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm leading-relaxed placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] resize-y min-h-[200px]"
        />
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="mt-3 rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">내 노트 목록</h3>
        {notes.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">아직 작성한 노트가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-4 hover:bg-[hsl(var(--muted))]/30 transition-colors"
              >
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">{n.date}</p>
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {n.content || "(비어 있음)"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(n.date);
                    setContent(n.content);
                  }}
                  className="mt-2 text-xs text-[hsl(var(--accent))] hover:underline"
                >
                  이 날짜로 편집
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
