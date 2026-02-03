import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PSCodeEditor } from "../../PSCodeEditor";

export default async function PSTopicPage({
  params,
}: {
  params: { id: string };
}) {
  const participantId = await getParticipantId();
  if (!participantId) return null;

  const { id } = params;
  const topic = await prisma.psTopic.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      codePosts: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!topic) notFound();

  const solutions = topic.codePosts.filter((p) => p.kind === "solution");
  const feedbacks = topic.codePosts.filter((p) => p.kind === "feedback");

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

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-200">정답 코드</h2>
        {solutions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
            아직 없어요.
          </p>
        ) : (
          <ul className="space-y-4">
            {solutions.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-2">
                  <span className="text-sm font-medium text-zinc-300">
                    {post.user?.name ?? "이름 없음"}
                  </span>
                  {post.title && (
                    <span className="text-xs text-zinc-500">{post.title}</span>
                  )}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-500">
                    {post.language}
                  </span>
                </div>
                <div className="p-2">
                  <PSCodeEditor
                    value={post.code}
                    readOnly
                    language={post.language}
                    minHeight="120px"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-200">피드백 원하는 코드</h2>
        {feedbacks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
            아직 없어요.
          </p>
        ) : (
          <ul className="space-y-4">
            {feedbacks.map((post) => (
              <li
                key={post.id}
                className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-2">
                  <span className="text-sm font-medium text-zinc-300">
                    {post.user?.name ?? "이름 없음"}
                  </span>
                  {post.title && (
                    <span className="text-xs text-zinc-500">{post.title}</span>
                  )}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-500">
                    {post.language}
                  </span>
                </div>
                <div className="p-2">
                  <PSCodeEditor
                    value={post.code}
                    readOnly
                    language={post.language}
                    minHeight="120px"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
