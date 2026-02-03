"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/login?registered=1");
        router.refresh();
        return;
      }
      setError(typeof data?.error === "string" ? data.error : "회원가입에 실패했습니다.");
    } catch {
      setError("연결에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 bg-[hsl(var(--background))]">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,18%)] to-[hsl(var(--background))] -z-10" />
      <div className="w-full max-w-[360px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8 shadow-xl mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-2xl font-bold text-[hsl(var(--foreground))] hover:opacity-90">
            警告
          </Link>
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))] mt-2">회원가입</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            이름, 이메일, 비밀번호만 있으면 돼요
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
              이름
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
              비밀번호 (6자 이상)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
              비밀번호 확인
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg py-2" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[hsl(var(--accent))] py-3 text-sm font-semibold text-[hsl(var(--accent-foreground))] hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {busy ? "가입 중…" : "가입하기"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold text-[hsl(var(--accent))] hover:underline">
            로그인
          </Link>
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        ← 홈으로
      </Link>
    </div>
  );
}
