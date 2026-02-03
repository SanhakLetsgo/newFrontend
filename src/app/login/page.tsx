"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        setBusy(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("로그인 처리 중 오류가 발생했습니다.");
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8 shadow-xl mx-auto">
      <div className="text-center mb-6">
        <Link href="/" className="inline-block text-2xl font-bold text-[hsl(var(--foreground))] hover:opacity-90">
          警告
        </Link>
        <h1 className="text-xl font-semibold text-[hsl(var(--foreground))] mt-2">로그인</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          이메일과 비밀번호를 입력하세요
        </p>
      </div>
      {registered && (
        <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm text-center py-2.5 mb-4" role="alert">
          회원가입이 완료되었어요. 로그인하세요.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[hsl(var(--muted-foreground))]">
        계정이 없으신가요?{" "}
        <Link href="/register" className="font-semibold text-[hsl(var(--accent))] hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-4 sm:p-6 bg-[hsl(var(--background))]">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,30%,18%)] to-[hsl(var(--background))] -z-10" />
      <Suspense
        fallback={
          <div className="w-full max-w-[360px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-xl animate-pulse h-80" />
        }
      >
        <LoginForm />
      </Suspense>
      <Link
        href="/"
        className="mt-6 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        ← 홈으로
      </Link>
    </div>
  );
}
