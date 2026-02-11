"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  actorName: string;
  message: string;
  link: string;
  createdAt: string;
};

export function HeaderNotification() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : "알림"}
        aria-expanded={open}
      >
        <span className="text-lg" aria-hidden>
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(90vw,360px)] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl overflow-hidden">
          <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">알림</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[hsl(var(--accent))] hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-[70dvh] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">불러오는 중…</p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">알림이 없어요.</p>
            ) : (
              <ul className="divide-y divide-[hsl(var(--border))]">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                        setOpen(false);
                      }}
                      className={`block px-3 py-2.5 text-left hover:bg-[hsl(var(--muted))]/50 transition-colors ${!n.read ? "bg-[hsl(var(--accent))]/5" : ""}`}
                    >
                      <p className="text-sm text-[hsl(var(--foreground))] line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(n.createdAt).toLocaleString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
