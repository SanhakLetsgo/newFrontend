import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PSCodeAccordionList } from "../../PSCodeAccordionList";

type CodePostRow = {
  id: string;
  kind: string;
  title: string | null;
  author: string | null;
  code: string;
  language: string;
  question: string | null;
  user: { id: string; name: string | null } | null;
};

type TopicWithPosts = {
  id: string;
  title: string;
  kind: string;
  codePosts: CodePostRow[];
  user: { id: string; name: string | null };
};

export default async function PSTopicPage({
  params,
}: {
  params: { id: string };
}) {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");

  const { id } = params;
  const topic = await db.psTopic.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      codePosts: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  }) as TopicWithPosts | null;

  if (!topic) notFound();

  const solutions = topic.codePosts.filter((p: CodePostRow) => p.kind === "solution");
  const feedbacks = topic.codePosts.filter((p: CodePostRow) => p.kind === "feedback");

  return (
    <div className="space-y-6">
      <Link
        href="/ps"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <span aria-hidden>←</span> 창고리즘 목록
      </Link>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6">
        <h1 className="text-xl font-semibold text-zinc-100">{topic.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {topic.kind === "lesson" ? "수업노트" : "주제"}
        </p>
      </div>

      <PSCodeAccordionList
        posts={solutions}
        sectionTitle="정답 코드"
        emptyMessage="아직 없어요."
      />

      <PSCodeAccordionList
        posts={feedbacks}
        sectionTitle="피드백 원하는 코드"
        emptyMessage="아직 없어요."
      />
    </div>
  );
}
