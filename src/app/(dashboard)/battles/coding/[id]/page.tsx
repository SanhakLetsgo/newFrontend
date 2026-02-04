import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CodingBattleProblemView } from "@/app/(dashboard)/battles/coding/[id]/CodingBattleProblemView";

type ProblemRow = {
  id: string;
  title: string;
  description: string;
  referenceCode: string | null;
  referenceLanguage: string | null;
  user: { name: string | null } | null;
};

type SubmissionRow = {
  code: string;
  language: string;
  startedAt: Date | null;
  completedAt: Date | null;
};

export default async function CodingBattleProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");
  const { id } = await params;
  const problem = (await prisma.codingBattleProblem.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })) as ProblemRow | null;
  if (!problem) {
    redirect("/battles/coding");
  }
  const mySubmission = (await prisma.codingBattleSubmission.findUnique({
    where: { problemId_userId: { problemId: id, userId: participantId } },
  })) as SubmissionRow | null;
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/battles/coding"
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← 코딩 경기 목록
        </Link>
      </div>
      <CodingBattleProblemView
        problem={{
          id: problem.id,
          title: problem.title,
          description: problem.description,
          referenceCode: problem.referenceCode ?? null,
          referenceLanguage: problem.referenceLanguage ?? "javascript",
          creatorName: problem.user?.name ?? "이름 없음",
        }}
        initialSubmission={
          mySubmission
            ? {
                code: mySubmission.code,
                language: mySubmission.language,
                startedAt: mySubmission.startedAt?.toISOString() ?? null,
                completedAt: mySubmission.completedAt?.toISOString() ?? null,
              }
            : null
        }
        currentUserId={participantId}
      />
    </div>
  );
}
