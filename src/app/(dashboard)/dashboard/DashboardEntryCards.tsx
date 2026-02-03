"use client";

import Link from "next/link";

const cards = [
  {
    title: "운동",
    description: "오늘 운동 기록·출석",
    href: "/workouts",
    icon: "🏃",
    hoverBorder: "hover:border-emerald-500/40",
    hoverText: "group-hover:text-emerald-400",
  },
  {
    title: "논문",
    description: "논문 스터디·리뷰",
    href: "/papers",
    icon: "📄",
    hoverBorder: "hover:border-violet-500/40",
    hoverText: "group-hover:text-violet-400",
  },
  {
    title: "창고리즘",
    description: "PS 스터디",
    href: "/ps",
    icon: "🧩",
    hoverBorder: "hover:border-amber-500/40",
    hoverText: "group-hover:text-amber-400",
  },
] as const;

export function DashboardEntryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className={`group block rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm p-6 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer ${card.hoverBorder}`}
        >
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl mb-3" aria-hidden>
              {card.icon}
            </span>
            <h2 className={`text-lg font-semibold text-[hsl(var(--foreground))] mb-1 transition-colors ${card.hoverText}`}>
              {card.title}
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {card.description}
            </p>
            <span className="mt-3 text-xs font-medium text-[hsl(var(--accent))] group-hover:underline">
              들어가기 →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
