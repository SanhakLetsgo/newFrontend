import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { PSNotesView } from "./PSNotesView";

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

export default async function PSPage() {
  const participantId = await getParticipantId();
  if (!participantId) return null;

  const today = new Date().toISOString().slice(0, 10);
  const from = new Date();
  from.setDate(from.getDate() - 60);
  const fromStr = from.toISOString().slice(0, 10);
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const [allUsers, weekNotes, myNotes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.psNote.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      select: { userId: true },
    }),
    prisma.psNote.findMany({
      where: { userId: participantId, date: { gte: fromStr, lte: today } },
      orderBy: { date: "desc" },
    }),
  ]);

  const weekCountByUser: Record<string, number> = {};
  for (const n of weekNotes) {
    weekCountByUser[n.userId] = (weekCountByUser[n.userId] ?? 0) + 1;
  }

  const allParticipantsStats = allUsers.map((u) => ({
    userId: u.id,
    name: u.name ?? "이름 없음",
    weekCount: weekCountByUser[u.id] ?? 0,
  })).sort((a, b) => b.weekCount - a.weekCount);

  const initialNotes = myNotes.map((n) => ({
    id: n.id,
    date: n.date,
    content: n.content,
    updatedAt: n.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">창고리즘 (PS 스터디)</h1>

      {/* 전체 참여자 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-5 shadow-lg shadow-black/5">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
          전체 참여자 현황
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">이번 주 정리 노트</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allParticipantsStats.map((p) => (
            <div
              key={p.userId}
              className={`rounded-xl border p-4 ${
                p.userId === participantId
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
              }`}
            >
              <p className="font-medium text-[hsl(var(--foreground))]">
                {p.name}
                {p.userId === participantId && (
                  <span className="ml-2 text-xs text-amber-400">(나)</span>
                )}
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{p.weekCount}일</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">이번 주</p>
            </div>
          ))}
        </div>
      </section>

      {/* 내 현황 */}
      <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 p-5 shadow-lg shadow-black/5">
        <h2 className="text-base font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
          내 현황
        </h2>
        <PSNotesView initialNotes={initialNotes} />
      </section>
    </div>
  );
}
