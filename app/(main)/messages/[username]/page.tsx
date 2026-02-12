"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { timeAgo } from "@/lib/helpers";

export default function ChatPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const res = await fetch(`/api/messages/${username}`);
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    loadMessages();
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [username]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText("");
    const res = await fetch(`/api/messages/${username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg }),
    });
    if (res.ok) loadMessages();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-rose-200 bg-rose-50/50 shrink-0">
        <Link href="/messages" className="text-rose-500">
          <ArrowLeft size={20} />
        </Link>
        <Link
          href={`/profile/${username}`}
          className="font-semibold text-sm hover:text-rose-500"
        >
          @{username}
        </Link>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2"
      >
        {messages.length === 0 ? (
          <div className="text-center py-16 text-warm-800/50">
            <div className="text-4xl mb-2">💌</div>
            <p className="text-sm">Say something nice!</p>
          </div>
        ) : (
          messages.map((m: any) => {
            const mine = m.sender_id === Number(session?.user?.id);
            return (
              <div
                key={m.id}
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-snug break-words ${
                  mine
                    ? "self-end gradient-bg text-white rounded-br-sm"
                    : "self-start bg-rose-50 border border-rose-100 rounded-bl-sm"
                }`}
              >
                {m.text}
                <div
                  className={`text-[10px] mt-0.5 opacity-70 ${
                    mine ? "text-right" : ""
                  }`}
                >
                  {timeAgo(m.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2 px-4 py-2.5 border-t border-rose-200 bg-white shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          maxLength={1000}
          autoFocus
          className="flex-1 border-[1.5px] border-rose-200 rounded-full px-4 py-2 text-sm outline-none focus:border-rose-500"
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2 gradient-bg text-white rounded-full font-bold text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
