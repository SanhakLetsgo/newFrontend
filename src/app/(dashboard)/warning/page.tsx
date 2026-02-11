import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import { WarningView } from "./WarningView";

export default async function WarningPage() {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/login");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-500/10 to-transparent p-4 sm:p-6 shadow-lg shadow-black/5">
        <h1 className="text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
          <span aria-hidden>⚠️</span> 경고판
        </h1>
        <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
          <p>참여자가 올리는 경고판입니다. 경고를 한 번 올릴 때마다 1회로 셉니다. 같은 사람에게 여러 번 경고하면 그 횟수만큼 쌓입니다.</p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><strong className="text-[hsl(var(--foreground))]">가중치</strong>: 이 경고가 순위에 반영되는 비율 (0~100%). 100%면 전부 반영, 50%면 절반만 반영.</li>
            <li><strong className="text-[hsl(var(--foreground))]">순위</strong>: 기만자 순위는 <strong className="text-amber-500">가중치 반영 점수</strong> 기준입니다. (받은 경고 횟수 × 가중치를 합산한 값)</li>
          </ul>
        </div>
      </div>
      <WarningView currentUserId={participantId} />
    </div>
  );
}
