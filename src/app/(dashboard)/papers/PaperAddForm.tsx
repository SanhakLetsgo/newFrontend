"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaperAddForm({ onDone }: { onDone?: () => void } = {}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [readAt, setReadAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [mySummary, setMySummary] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError({});
    setBusy(true);
    try {
      const hasFile = pdfFile && pdfFile.size > 0;
      if (hasFile) {
        const formData = new FormData();
        formData.set("title", title.trim());
        formData.set("tags", tagsStr);
        formData.set("readAt", readAt);
        if (mySummary.trim()) formData.set("mySummary", mySummary.trim());
        formData.set("pdf", pdfFile);
        const res = await fetch("/api/papers", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? { _: ["등록 실패"] });
          return;
        }
        router.push(`/papers/${data.id}`);
        router.refresh();
        onDone?.();
      } else {
        const res = await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            tags: tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
            readAt,
            mySummary: mySummary.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? { _: ["등록 실패"] });
          return;
        }
        router.push(`/papers/${data.id}`);
        router.refresh();
        onDone?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
      <h2 className="text-base font-semibold mb-3">논문 추가</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">논문 제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="논문 제목을 입력하세요"
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
          {error.title?.[0] && <p className="text-xs text-red-600 mt-1">{error.title[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">논문 PDF</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            className="block w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm file:ml-0 file:mr-3 file:mt-0 file:inline-flex file:h-8 file:items-center file:justify-center file:rounded-md file:border-0 file:bg-[hsl(var(--primary))] file:px-3 file:py-0 file:text-sm file:font-medium file:text-[hsl(var(--primary-foreground))] file:cursor-pointer"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">PDF 파일을 올리면 저장 시 함께 저장됩니다.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">나만의 정리</label>
          <textarea
            value={mySummary}
            onChange={(e) => setMySummary(e.target.value)}
            rows={6}
            placeholder="논문 요약, 핵심 내용, 메모 등을 자유롭게 적어주세요"
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">태그 (쉼표 구분)</label>
          <input
            type="text"
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="NLP, BERT"
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">읽은 날짜</label>
          <input
            type="date"
            value={readAt}
            onChange={(e) => setReadAt(e.target.value)}
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
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
          <button
            type="button"
            onClick={() => router.push("/papers")}
            className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-sm"
          >
            취소
          </button>
        </div>
      </form>
    </section>
  );
}
