"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/helpers";
import { NOTIF_MAP } from "@/lib/constants";

const notifStyles: Record<string, string> = {
  like: "bg-rose-100 text-rose-500",
  reply: "bg-indigo-100 text-indigo-500",
  follow: "bg-emerald-100 text-emerald-500",
  repost: "bg-emerald-100 text-emerald-500",
  message: "bg-purple-100 text-purple-500",
  reaction: "bg-amber-100 text-amber-600",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
      setLoading(false);
    })();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "POST" });
    setNotifications(
      notifications.map((n: any) => ({ ...n, is_read: 1 }))
    );
    toast("All caught up!");
  };

  const getLink = (n: any) => {
    if (n.type === "follow") return `/profile/${n.actor_username}`;
    if (n.type === "message") return `/messages/${n.actor_username}`;
    return "/";
  };

  return (
    <>
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-rose-200 bg-rose-50/50">
        <span className="font-serif text-lg font-bold">Notifications</span>
        <button
          onClick={markAllRead}
          className="px-3 py-1 rounded-lg text-xs font-semibold border-[1.5px] border-rose-200 hover:border-rose-500 hover:text-rose-500 transition-colors"
        >
          Mark all read
        </button>
      </div>
      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <div className="text-4xl mb-2">🔔</div>
          <p className="text-sm">
            <b className="text-warm-900">No notifications yet.</b>
            <br />
            When people interact with your posts, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        notifications.map((n: any) => {
          const info = NOTIF_MAP[n.type] || {
            icon: "❤️",
            text: "interacted with you",
          };
          return (
            <Link
              key={n.id}
              href={getLink(n)}
              className={`flex gap-3 px-4 py-3 border-b border-rose-100 items-start hover:bg-rose-50 transition-colors ${
                n.is_read ? "" : "bg-rose-500/[0.04]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] shrink-0 ${
                  notifStyles[n.type] || ""
                }`}
              >
                {info.icon}
              </div>
              <div>
                <p className="text-sm">
                  <b className="font-semibold">
                    {n.actor_display_name || n.actor_username}
                  </b>{" "}
                  {info.text}
                </p>
                <p className="text-[11px] text-warm-800/40 mt-0.5">
                  {timeAgo(n.timestamp)}
                </p>
              </div>
            </Link>
          );
        })
      )}
    </>
  );
}
