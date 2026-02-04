"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/workouts", label: "운동", active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
  { href: "/papers", label: "논문", active: "bg-violet-500/15 text-violet-400 border border-violet-500/20" },
  { href: "/ps", label: "창고리즘", active: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
  { href: "/battles", label: "배틀", active: "bg-rose-500/15 text-rose-400 border border-rose-500/20" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <>
      {navItems.map(({ href, label, active }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-xs sm:text-sm font-medium px-2.5 sm:px-3.5 py-2 rounded-lg border border-transparent transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isActive ? active : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/60 hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
