"use client";

import Link from "next/link";

const cards = [
  {
    title: "운동",
    description: "오늘 운동 기록·출석",
    href: "/workouts",
    icon: "🏃",
    gradient: "from-emerald-500/10 to-transparent",
    border: "border-emerald-500/20",
    hover: "hover:border-emerald-500/40 hover:shadow-xl",
    text: "group-hover:text-emerald-400",
  },
  {
    title: "논문",
    description: "논문 스터디·리뷰",
    href: "/papers",
    icon: "📄",
    gradient: "from-violet-500/10 to-transparent",
    border: "border-violet-500/20",
    hover: "hover:border-violet-500/40 hover:shadow-xl",
    text: "group-hover:text-violet-400",
  },
  {
    title: "창고리즘",
    description: "PS 스터디",
    href: "/ps",
    icon: "🧩",
    gradient: "from-amber-500/10 to-transparent",
    border: "border-amber-500/20",
    hover: "hover:border-amber-500/40 hover:shadow-xl",
    text: "group-hover:text-amber-400",
  },
] as const;

export function DashboardEntryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className={`group relative block overflow-hidden rounded-2xl border bg-gradient-to-b ${card.gradient} bg-[hsl(var(--card))] p-5 sm:p-6 md:p-8 shadow-lg shadow-black/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.99] ${card.border} ${card.hover}`}
        >
          <div className="flex flex-col items-center text-center">
            <span className="text-3xl sm:text-4xl mb-3 sm:mb-4 drop-shadow-sm" aria-hidden>
              {card.icon}
            </span>
            <h2 className={`text-lg sm:text-xl font-semibold text-[hsl(var(--foreground))] mb-1 sm:mb-1.5 transition-colors ${card.text}`}>
              {card.title}
            </h2>
            <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))]">
              {card.description}
            </p>
            <span className="mt-3 sm:mt-4 text-xs font-medium text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--accent))] transition-colors">
              들어가기 →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
