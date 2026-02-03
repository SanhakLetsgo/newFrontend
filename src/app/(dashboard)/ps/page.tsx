import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { PSNotesView } from "./PSNotesView";
import { PSTopicsView } from "./PSTopicsView";

type PsNoteDelegate = {
  findMany: (args: object) => Promise<{ id: string; userId: string; date: string; content: string; updatedAt: Date }[]>;
};
type PsTopicDelegate = {
  findMany: (args: object) => Promise<Array<{
    id: string;
    userId: string;
    title: string;
    kind: string;
    createdAt: Date;
    user: { id: string; name: string | null };
    _count: { codePosts: number };
  }>>;
};
const db = prisma as typeof prisma & { psNote: PsNoteDelegate; psTopic: PsTopicDelegate };

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

  const [allUsers, weekNotes, myNotes, topics] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    db.psNote.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      select: { userId: true },
    }) as Promise<{ userId: string }[]>,
    db.psNote.findMany({
      where: { userId: participantId, date: { gte: fromStr, lte: today } },
      orderBy: { date: "desc" },
    }),
    db.psTopic.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { codePosts: true } },
      },
    }) as Promise<Array<{
      id: string;
      userId: string;
      title: string;
      kind: string;
      createdAt: Date;
      user: { id: string; name: string | null };
      _count: { codePosts: number };
    }>>,
  ]);

  const weekCountByUser: Record<string, number> = {};
  for (const n of weekNotes as { userId: string }[]) {
    weekCountByUser[n.userId] = (weekCountByUser[n.userId] ?? 0) + 1;
  }

  type UserRow = { id: string; name: string | null };
  type ParticipantStat = { userId: string; name: string; weekCount: number };
  const allParticipantsStats = (allUsers as UserRow[]).map((u: UserRow): ParticipantStat => ({
    userId: u.id,
    name: u.name ?? "이름 없음",
    weekCount: weekCountByUser[u.id] ?? 0,
  })).sort((a: ParticipantStat, b: ParticipantStat) => b.weekCount - a.weekCount);

  type NoteRow = { id: string; date: string; content: string; updatedAt: Date };
  const initialNotes = (myNotes as NoteRow[]).map((n: NoteRow) => ({
    id: n.id,
    date: n.date,
    content: n.content,
    updatedAt: n.updatedAt.toISOString(),
  }));

  type TopicRow = (typeof topics)[number];
  const initialTopics = topics.map((t: TopicRow) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    user: { id: t.user.id, name: t.user.name },
    _count: t._count,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">창고리즘 (PS 스터디)</h1>

      {/* 주제·수업노트 + 코드 (다크 테마) */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <PSTopicsView initialTopics={initialTopics} />
      </div>

      {/* 전체 참여자 현황 (다크 카드) */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-200 mb-4 pb-2 border-b border-white/10">
          전체 참여자 현황
        </h2>
        <p className="text-sm text-zinc-500 mb-4">이번 주 정리 노트</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allParticipantsStats.map((p: ParticipantStat) => (
            <div
              key={p.userId}
              className={`rounded-xl border p-4 ${
                p.userId === participantId
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-white/10 bg-zinc-800/50"
              }`}
            >
              <p className="font-medium text-zinc-100">
                {p.name}
                {p.userId === participantId && (
                  <span className="ml-2 text-xs text-amber-400">(나)</span>
                )}
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{p.weekCount}일</p>
              <p className="text-xs text-zinc-500">이번 주</p>
            </div>
          ))}
        </div>
      </section>

      {/* 내 현황 - 일일 노트 */}
      <section className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="text-base font-semibold text-zinc-200 mb-4 pb-2 border-b border-white/10">
          내 현황 · 일일 정리 노트
        </h2>
        <PSNotesView initialNotes={initialNotes} />
      </section>
    </div>
  );
}
