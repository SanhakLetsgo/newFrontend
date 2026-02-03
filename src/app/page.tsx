import { redirect } from "next/navigation";
import { getParticipantId } from "@/lib/participant";
import Link from "next/link";

export default async function Home() {
  const participantId = await getParticipantId();
  if (participantId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] px-6">
      <div className="relative overflow-hidden w-full max-w-2xl text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,35%,14%)] via-[hsl(220,28%,16%)] to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,hsl(199,89%,48%,0.12),transparent_50%)] pointer-events-none" />
        <div className="relative pt-4 pb-12">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-[hsl(var(--foreground))] tracking-tight drop-shadow-sm mb-8">
            警告
          </h1>
          <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] font-light leading-relaxed mb-12 max-w-md mx-auto">
            윗 스터디는 창민석과 아이들을 위한 스터디입니다.
            <br />
            정말 도전하시겠습니까?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-[hsl(var(--accent))] px-12 py-4 text-lg font-semibold text-[hsl(var(--accent-foreground))] shadow-xl shadow-[hsl(199,89%,48%,0.25)] hover:shadow-2xl hover:shadow-[hsl(199,89%,48%,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
