"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PARTICIPANT_NAMES = ["신현호", "창민석", "송수현", "강태영", "이윤지", "조수민"];

export function ParticipantSelect() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const select = async (name: string) => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/session/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const msg = typeof data?.error === "string" ? data.error : "선택에 실패했습니다";
        setError(msg);
      }
    } catch {
      setError("연결에 실패했습니다. 서버가 켜져 있는지 확인하세요.");
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1"
        >
          ← 뒤로가기
        </button>
        <span className="flex-1" />
      </div>
      <h1 className="text-xl font-semibold text-center mb-2">참여자 선택</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))] text-center mb-4">
        나는 누구인가요?
      </p>
      <ul className="space-y-2 mb-4">
        {PARTICIPANT_NAMES.map((name) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => select(name)}
              disabled={busy}
              className="w-full rounded-md border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] disabled:opacity-50"
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
