import { getParticipantId } from "@/lib/participant";
import Link from "next/link";
import { DashboardEntryCards } from "./DashboardEntryCards";

export default async function DashboardPage() {
  const participantId = await getParticipantId();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center">
      <div className="space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[hsl(var(--foreground))] tracking-tight">
            창민석과 아이들
          </h1>
          <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
            警告(위험한 일을 조심하거나 삼가도록 미리 일러서 주의를 주다.)
          </p>
        </header>
        <h2 className="sr-only">대시보드</h2>
        {!participantId && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-6 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              로그인하거나 회원가입하면 운동·논문·창고리즘 기록을 쌓을 수 있어요.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[hsl(var(--border))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--accent))] px-6 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity"
              >
                회원가입
              </Link>
            </div>
          </div>
        )}
        <DashboardEntryCards />
      </div>
    </div>
  );
}
