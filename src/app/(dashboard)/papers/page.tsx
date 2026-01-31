import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PapersList } from "./PapersList";
import { PaperAddForm } from "./PaperAddForm";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const participantId = await getParticipantId();
  if (!participantId) return null;
  const params = await searchParams;
  const showAdd = params.add === "1";
  const papers = await prisma.paper.findMany({
    include: { review: true, user: { select: { name: true } } },
    orderBy: { readAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">논문 스터디 (모든 참여자)</h1>
        {!showAdd && (
          <Link
            href="/papers?add=1"
            className="rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1.5 text-sm font-medium"
          >
            논문 추가
          </Link>
        )}
      </div>
      {showAdd && <PaperAddForm />}
      <PapersList papers={papers} />
    </div>
  );
}
