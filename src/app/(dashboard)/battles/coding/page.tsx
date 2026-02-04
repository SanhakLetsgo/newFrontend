import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import Link from "next/link";
import { CodingBattleProblemsView } from "./CodingBattleProblemsView";

export default async function CodingBattlePage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <span aria-hidden>💻</span> 코딩 경기
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            이번 주 문제를 풀고 걸린 시간으로 순위를 겨뤄요.
          </p>
        </div>
        <Link
          href="/battles"
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          ← 배틀 경기장
        </Link>
      </div>
      <CodingBattleProblemsView />
    </div>
  );
}
