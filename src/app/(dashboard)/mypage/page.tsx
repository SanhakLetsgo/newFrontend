import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { getWeekRange } from "@/lib/week";
import Link from "next/link";

export const metadata = {
  title: "마이페이지",
  description: "내 운동 현황, 논문, 정리한 코드",
};

export default async function MyPage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");

  const { start: weekStart, end: weekEnd } = getWeekRange();
  const today = new Date().toISOString().slice(0, 10);

  const [user, weekLogs, weekAttendanceSet, myPapers, myCodePosts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: participantId },
      select: { name: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId: participantId, date: { gte: weekStart, lte: weekEnd } },
      select: { date: true, calories: true },
    }),
    (async () => {
      const logs = await prisma.workoutLog.findMany({
        where: { userId: participantId, date: { gte: weekStart, lte: weekEnd } },
        select: { date: true },
      });
      return new Set(logs.map((l) => l.date));
    })(),
    prisma.paper.findMany({
      where: { userId: participantId },
      orderBy: { readAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        readAt: true,
        url: true,
        review: { select: { id: true } },
      },
    }),
    (
      prisma as {
        psCodePost: {
          findMany: (args: {
            where: { userId: string };
            orderBy: { createdAt: "desc" };
            take: number;
            include: { topic: { select: { id: true; title: true } } };
          }) => Promise<Array<{
            id: string;
            title: string | null;
            kind: string;
            language: string;
            createdAt: Date;
            topic: { id: string; title: string };
          }>>;
        };
      }
    ).psCodePost.findMany({
      where: { userId: participantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { topic: { select: { id: true, title: true } } },
    }),
  ]);

  const displayName = user?.name ?? "참여자";
  const weekCalories = weekLogs.reduce((sum, l) => sum + (l.calories ?? 0), 0);
  const weekCount = weekLogs.length;
  const weekAttendanceDays = weekAttendanceSet.size;

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 pb-safe">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))]">마이페이지</h1>
        <Link
          href="/dashboard"
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          홈으로
        </Link>
      </div>
      {/* 히어로: 이름 + 한줄 요약 */}
      <section className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--accent))]/15 via-[hsl(var(--card))] to-[hsl(var(--muted))]/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--accent)/0.12),transparent)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]/25 text-2xl sm:text-3xl shadow-inner">
              👤
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">
                {displayName}
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                이번 주 활동 요약
              </p>
            </div>
          </div>
          <Link
            href="/workouts"
            className="inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shrink-0"
          >
            운동 기록하기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 내 운동 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))]/95 to-[hsl(var(--muted))]/30 p-5 sm:p-6 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
          <span className="text-2xl" aria-hidden>🏃</span>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))]">
              내 운동 현황
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              이번 주 ({weekStart} ~ {weekEnd})
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[hsl(var(--accent))]">
              {weekCount}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">운동 횟수</p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-amber-500">
              {weekCalories}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">소모 칼로리 (kcal)</p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-500">
              {weekAttendanceDays}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">출석 일수</p>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/workouts"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--accent))] hover:underline"
          >
            운동 페이지에서 상세 보기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 내가 쓴 논문 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-violet-500/10 to-[hsl(var(--card))] p-5 sm:p-6 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
          <span className="text-2xl" aria-hidden>📄</span>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))]">
              내가 쓴 논문
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              최근 읽고 정리한 논문
            </p>
          </div>
        </div>
        {myPapers.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">
            아직 등록한 논문이 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {myPapers.map((paper) => (
              <li key={paper.id}>
                <Link
                  href={`/papers/${paper.id}`}
                  className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-3 sm:p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
                >
                  <p className="font-medium text-[hsl(var(--foreground))] line-clamp-2">
                    {paper.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{paper.readAt}</span>
                    {paper.review && (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-400">
                        리뷰 작성됨
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link
            href="/papers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:underline"
          >
            논문 스터디 전체 보기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 내가 정리한 코드들 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-amber-500/10 to-[hsl(var(--card))] p-5 sm:p-6 shadow-lg overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
          <span className="text-2xl" aria-hidden>🧩</span>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[hsl(var(--foreground))]">
              내가 정리한 코드
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              창고리즘 · PS 스터디 코드
            </p>
          </div>
        </div>
        {myCodePosts.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">
            아직 정리한 코드가 없어요.
          </p>
        ) : (
          <ul className="space-y-3">
            {myCodePosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/ps/topics/${post.topic.id}`}
                  className="block rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 p-3 sm:p-4 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
                >
                  <p className="font-medium text-[hsl(var(--foreground))]">
                    {post.title || "(제목 없음)"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                    <span className="rounded bg-[hsl(var(--muted))]/60 px-2 py-0.5">
                      {post.topic.title}
                    </span>
                    <span>{post.language}</span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Link
            href="/ps"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 hover:underline"
          >
            창고리즘 전체 보기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
