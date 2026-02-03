import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PaperDetail } from "../PaperDetail";

export default async function PaperDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");
  const { id } = params;
  const paper = await prisma.paper.findUnique({
    where: { id },
    include: {
      review: true,
      user: { select: { name: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!paper) notFound();
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/papers"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <span aria-hidden>←</span> 목록
      </Link>
      <PaperDetail paper={paper} />
    </div>
  );
}
