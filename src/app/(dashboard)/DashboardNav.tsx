"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <>
      <Link
        href="/workouts"
        className={`text-sm px-3 py-1.5 rounded-md ${
          pathname.startsWith("/workouts")
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        }`}
      >
        운동
      </Link>
      <Link
        href="/papers"
        className={`text-sm px-3 py-1.5 rounded-md ${
          pathname.startsWith("/papers")
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        }`}
      >
        논문
      </Link>
      <Link
        href="/ps"
        className={`text-sm px-3 py-1.5 rounded-md ${
          pathname.startsWith("/ps")
            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        }`}
      >
        창고리즘
      </Link>
    </>
  );
}
