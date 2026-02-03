import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DashboardNav } from "./DashboardNav";
import { HeaderSignOut } from "@/app/(dashboard)/HeaderSignOut";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const participantId = await getParticipantId();
  let displayName: string | null = null;
  if (participantId) {
    const user = await prisma.user.findUnique({
      where: { id: participantId },
      select: { name: true },
    });
    displayName = user?.name ?? "참여자";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] min-h-[100dvh]">
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))]/80 bg-[hsl(var(--background))]/90 backdrop-blur-md">
        <div className="flex items-center justify-between min-h-14 h-14 px-3 sm:px-6 max-w-4xl mx-auto w-full gap-2">
          <Link
            href="/dashboard"
            className="font-semibold text-[hsl(var(--foreground))] tracking-tight hover:text-[hsl(var(--accent))] transition-colors shrink-0"
            title="홈으로"
          >
            警告
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-end min-w-0">
            {participantId ? (
              <>
                <DashboardNav />
                <span className="text-[hsl(var(--muted-foreground))] mx-1">·</span>
                <Link
                  href="/dashboard"
                  className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] px-2 sm:px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] transition-colors truncate max-w-[80px] sm:max-w-none"
                >
                  {displayName}
                </Link>
                <HeaderSignOut />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-[hsl(var(--muted-foreground))] px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  로그인
                </Link>
                <span className="text-[hsl(var(--muted-foreground))] mx-0.5">·</span>
                <Link
                  href="/register"
                  className="text-sm font-medium text-[hsl(var(--accent))] px-3 py-2 rounded-lg hover:bg-[hsl(var(--accent))]/10 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full box-border">{children}</main>
    </div>
  );
}
