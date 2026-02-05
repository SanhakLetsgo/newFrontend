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
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          참여자가 올리는 경고판입니다. 대상 이름, 횟수, 가중치(0~100% 만점)를 입력해 경고를 올리면 기만자 순위에 총 횟수로 반영됩니다.
        </p>
      </div>
      <WarningView currentUserId={participantId} />
    </div>
  );
}
