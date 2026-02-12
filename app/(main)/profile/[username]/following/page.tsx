"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

export default function FollowingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/users/${username}/following`);
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    })();
  }, [username]);

  return (
    <>
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-rose-200 bg-rose-50/50">
        <Link href={`/profile/${username}`} className="text-rose-500">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-serif text-lg font-bold">
          @{username} follows
        </span>
      </div>
      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50 text-sm">
          Not following anyone yet.
        </div>
      ) : (
        users.map((u: any) => (
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
