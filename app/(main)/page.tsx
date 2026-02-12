"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/feed/post-card";
import { CreatePostForm } from "@/components/feed/create-post-form";
import { Spinner } from "@/components/ui/spinner";

type FeedType = "all" | "following" | "trending";

export default function FeedPage() {
  const { data: session } = useSession();
  const [feed, setFeed] = useState<FeedType>("all");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    const sort = feed === "trending" ? "top" : "recent";
    const feedParam = feed === "following" ? "following" : "all";
    const res = await fetch(`/api/posts?feed=${feedParam}&sort=${sort}`);
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, [feed]);

  return (
    <>
      <div className="flex border-b border-rose-200">
        {(["all", "following", "trending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFeed(t)}
            className={`flex-1 text-center py-3 text-sm font-medium relative transition-colors hover:bg-rose-50 ${
              feed === t ? "text-warm-900 font-bold" : "text-warm-800/50"
            }`}
          >
            {t === "all" ? "For You" : t === "following" ? "Following" : "Trending"}
            {feed === t && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] gradient-bg rounded-sm" />
            )}
          </button>
        ))}
      </div>

      <CreatePostForm onPostCreated={loadPosts} />

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <div className="text-4xl mb-2">💭</div>
          <p className="text-sm">
            <b className="text-warm-900">No confessions yet.</b>
            <br />
            Be the first to share your heart.
          </p>
        </div>
      ) : (
        posts.map((p: any) => (
          <PostCard
            key={p.id}
            post={p}
            currentUserId={session?.user?.id}
          />
        ))
      )}
    </>
  );
}
