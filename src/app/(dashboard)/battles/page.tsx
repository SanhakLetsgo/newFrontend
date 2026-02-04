import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { BattlesView } from "./BattlesView";

export default async function BattlesPage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-500/10 to-transparent p-4 sm:p-6 shadow-lg shadow-black/5">
        <h1 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
          <span aria-hidden>🏆</span> 배틀 경기장
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          이번 주 월요일~일요일까지의 운동·코딩 기록으로 순위가 정해져요. 기록을 쌓으면 자동으로 경기에 참가한 걸로 반영됩니다.
        </p>
      </div>
      <BattlesView currentUserId={participantId} />
    </div>
  );
}
