"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PostCard } from "@/components/feed/post-card";
import { Spinner } from "@/components/ui/spinner";

export default function SearchPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"posts" | "users">("posts");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const endpoint =
        tab === "posts"
          ? `/api/posts/search?q=${encodeURIComponent(q)}`
          : `/api/users/search?q=${encodeURIComponent(q)}`;
      const res = await fetch(endpoint);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    },
    [tab]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <>
      <div className="px-4 py-3 border-b border-rose-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search confessions or people..."
          autoFocus
          className="w-full px-4 py-2.5 border-[1.5px] border-rose-200 rounded-full text-sm outline-none focus:border-rose-500 bg-warm-50"
        />
      </div>
      <div className="flex border-b border-rose-200">
        {(["posts", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-center py-3 text-sm font-medium relative transition-colors hover:bg-rose-50 ${
              tab === t ? "text-warm-900 font-bold" : "text-warm-800/50"
            }`}
          >
            {t === "posts" ? "Posts" : "People"}
            {tab === t && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] gradient-bg rounded-sm" />
            )}
          </button>
        ))}
      </div>
      {loading ? (
        <Spinner />
      ) : !query.trim() ? (
        <div className="text-center py-16 text-warm-800/50">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-sm">Type to search...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <p className="text-sm">
            No {tab} found for &quot;{query}&quot;
          </p>
        </div>
      ) : tab === "posts" ? (
        results.map((p: any) => (
          <PostCard
            key={p.id}
            post={p}
            currentUserId={session?.user?.id}
          />
        ))
      ) : (
        results.map((u: any) => (
          <Link
            key={u.id}
            href={`/profile/${u.username}`}
            className="flex gap-3 px-4 py-3 border-b border-rose-100 items-center hover:bg-rose-50 transition-colors"
          >
            <Avatar src={u.avatar_url} alt={u.display_name || u.username} />
            <div>
              <div className="font-semibold text-sm">{u.display_name}</div>
              <div className="text-warm-800/50 text-xs">@{u.username}</div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
