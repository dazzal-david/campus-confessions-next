"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/feed/post-card";
import { Spinner } from "@/components/ui/spinner";

export default function BookmarksPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/bookmarks");
      if (res.ok) setPosts(await res.json());
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <div className="font-serif text-lg font-bold px-4 py-3.5 border-b border-rose-200 bg-rose-50/50">
        Saved Confessions
      </div>
      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <div className="text-4xl mb-2">💖</div>
          <p className="text-sm">
            <b className="text-warm-900">No saved confessions yet.</b>
            <br />
            Tap the bookmark icon on posts to save them here.
          </p>
        </div>
      ) : (
        posts.map((p: any) => (
          <PostCard key={p.id} post={p} currentUserId={session?.user?.id} />
        ))
      )}
    </>
  );
}
