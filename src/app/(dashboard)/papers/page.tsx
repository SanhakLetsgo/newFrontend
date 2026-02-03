import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PapersList } from "./PapersList";
import { PaperAddForm } from "./PaperAddForm";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const participantId = await getParticipantId();
  if (!participantId) return null;
  const params = await searchParams;
  const showAdd = params.add === "1";
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const [papers, allUsers, weekPapers] = await Promise.all([
    prisma.paper.findMany({
      include: { review: true, user: { select: { name: true } } },
      orderBy: { readAt: "desc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.paper.findMany({
      where: { readAt: { gte: weekStart, lte: weekEnd } },
      select: { userId: true },
    }),
  ]);

  const weekCountByUser: Record<string, number> = {};
  for (const p of weekPapers) {
    weekCountByUser[p.userId] = (weekCountByUser[p.userId] ?? 0) + 1;
  }

  const allParticipantsStats = allUsers.map((u) => ({
    userId: u.id,
    name: u.name ?? "이름 없음",
    weekCount: weekCountByUser[u.id] ?? 0,
  })).sort((a, b) => b.weekCount - a.weekCount);

  const myPapers = papers.filter((p) => p.userId === participantId);
  const hasAnyParticipant = allParticipantsStats.some((p) => p.weekCount > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">논문</h1>

      {/* 전체 참여자 현황 - 이번 주 작성자가 있을 때만 표시 */}
      {hasAnyParticipant && (
        <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-5 shadow-lg shadow-black/5">
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
            전체 참여자 현황
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">이번 주 읽은 논문</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allParticipantsStats.map((p) => (
              <div
                key={p.userId}
                className={`rounded-xl border p-4 ${
                  p.userId === participantId
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
                }`}
              >
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {p.name}
                  {p.userId === participantId && (
                    <span className="ml-2 text-xs text-violet-400">(나)</span>
                  )}
                </p>
                <p className="text-2xl font-bold text-violet-400 mt-1">{p.weekCount}개</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">이번 주</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 내 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-5 shadow-lg shadow-black/5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[hsl(var(--border))]">
          <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">내 현황</h2>
          {!showAdd && (
            <Link
              href="/papers?add=1"
              className="rounded-xl bg-[hsl(var(--accent))] text-white px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              논문 추가 + 리뷰 작성
            </Link>
          )}
        </div>
        {showAdd && <PaperAddForm />}
        {!showAdd && <PapersList papers={myPapers} />}
      </section>
    </div>
  );
}
