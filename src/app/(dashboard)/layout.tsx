import { getParticipantId } from "@/lib/participant";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/");
  const user = await prisma.user.findUnique({
    where: { id: participantId },
    select: { name: true },
  });
  if (!user) redirect("/");
  const displayName = user.name ?? "참여자";
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <div className="flex items-center justify-between h-12 px-4 max-w-4xl mx-auto">
          <Link href="/dashboard" className="font-semibold text-[hsl(var(--foreground))]">
            警告(위험한 일을 조심하거나 삼가도록 미리 일러서 주의를 주다.)
          </Link>
          <nav className="flex items-center gap-1">
            <DashboardNav />
            <span className="text-sm text-[hsl(var(--muted-foreground))] px-2">
              {displayName}
            </span>
            <Link
              href="/api/session/clear?redirect=/"
              className="text-sm text-[hsl(var(--muted-foreground))] px-2 py-1 rounded hover:bg-[hsl(var(--muted))]"
            >
              참여자 변경
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
