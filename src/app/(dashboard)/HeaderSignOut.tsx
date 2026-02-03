"use client";

import { signOut } from "next-auth/react";

export function HeaderSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-[hsl(var(--muted-foreground))] px-3 py-2 rounded-lg hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] transition-colors"
    >
      로그아웃
    </button>
  );
}
