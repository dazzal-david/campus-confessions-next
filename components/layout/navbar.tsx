"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Bell, Mail } from "lucide-react";

export function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky top-0 bg-rose-50/92 backdrop-blur-md z-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between">
      <Link href="/" className="gradient-text font-serif text-xl font-bold">
        Campus Confessions
      </Link>
      <div className="flex gap-1.5">
        <Link
          href="/search"
          className="w-9 h-9 rounded-full flex items-center justify-center text-warm-800/60 hover:bg-rose-100 hover:text-rose-500 transition-colors"
        >
          <Search size={20} />
        </Link>
        <Link
          href="/notifications"
          className="w-9 h-9 rounded-full flex items-center justify-center text-warm-800/60 hover:bg-rose-100 hover:text-rose-500 transition-colors relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold min-w-4 h-4 rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/messages"
          className="w-9 h-9 rounded-full flex items-center justify-center text-warm-800/60 hover:bg-rose-100 hover:text-rose-500 transition-colors"
        >
          <Mail size={20} />
        </Link>
      </div>
    </div>
  );
}
