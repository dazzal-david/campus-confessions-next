"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { timeAgo } from "@/lib/helpers";

export default function MessagesPage() {
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/messages");
      if (res.ok) setConvos(await res.json());
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <div className="font-serif text-lg font-bold px-4 py-3.5 border-b border-rose-200 bg-rose-50/50">
        Messages
      </div>
      {loading ? (
        <Spinner />
      ) : convos.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <div className="text-4xl mb-2">💌</div>
          <p className="text-sm">
            <b className="text-warm-900">No messages yet.</b>
            <br />
            Visit someone&apos;s profile to start a conversation.
          </p>
        </div>
      ) : (
        convos.map((c: any) => (
          <Link
            key={c.other_id}
            href={`/messages/${c.username}`}
            className="flex gap-3 px-4 py-3 border-b border-rose-100 items-center hover:bg-rose-50 transition-colors"
          >
            <Avatar
              src={c.avatar_url}
              alt={c.display_name || c.username}
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{c.display_name}</div>
              <div className="text-warm-800/50 text-xs truncate">
                {c.last_message}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-warm-800/40">
                {timeAgo(c.timestamp)}
              </div>
              {c.unread_count > 0 && (
                <span className="inline-flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full mt-1 px-1">
                  {c.unread_count}
                </span>
              )}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
