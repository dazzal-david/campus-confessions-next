"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PostCard } from "@/components/feed/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: session } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`/api/users/${username}`),
        fetch(`/api/posts/user/${username}`),
      ]);
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
        setEditName(p.display_name);
        setEditBio(p.bio || "");
      }
      if (postsRes.ok) setPosts(await postsRes.json());
      setLoading(false);
    })();
  }, [username]);

  const toggleFollow = async () => {
    const res = await fetch(`/api/users/${username}/follow`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p: any) => ({
        ...p,
        is_following: data.following,
        follower_count: p.follower_count + (data.following ? 1 : -1),
      }));
    }
  };

  const saveProfile = async () => {
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: editName, bio: editBio }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p: any) => ({ ...p, ...data }));
      setEditing(false);
      toast("Profile updated!");
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/users/me/avatar", {
      method: "PUT",
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p: any) => ({ ...p, avatar_url: data.avatar_url }));
      toast("Avatar updated!");
    }
  };

  if (loading) return <Spinner />;
  if (!profile) {
    return (
      <div className="text-center py-16 text-warm-800/50">User not found</div>
    );
  }

  return (
    <>
      <div className="px-4 py-5 border-b border-rose-200">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar
              src={profile.avatar_url}
              alt={profile.display_name}
              size="lg"
            />
            {profile.is_self && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-rose-200 rounded-full flex items-center justify-center text-xs hover:border-rose-500"
                >
                  📷
                </button>
              </>
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-sm outline-none focus:border-rose-500"
                />
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={160}
                  rows={2}
                  className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-sm outline-none focus:border-rose-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    className="px-4 py-1.5 gradient-bg text-white rounded-lg font-bold text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-1.5 border border-rose-200 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-lg leading-tight">
                  {profile.display_name}
                </h2>
                <p className="text-warm-800/50 text-sm">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm mt-1.5">{profile.bio}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Link
            href={`/profile/${username}/followers`}
            className="text-sm hover:text-rose-500"
          >
            <b>{profile.follower_count}</b>{" "}
            <span className="text-warm-800/50">followers</span>
          </Link>
          <Link
            href={`/profile/${username}/following`}
            className="text-sm hover:text-rose-500"
          >
            <b>{profile.following_count}</b>{" "}
            <span className="text-warm-800/50">following</span>
          </Link>
          <span className="text-sm text-warm-800/50">
            {profile.post_count} posts
          </span>

          <div className="ml-auto">
            {profile.is_self ? (
              !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-1.5 rounded-lg font-semibold text-xs border-[1.5px] border-rose-200 hover:border-rose-500 hover:text-rose-500 transition-colors"
                >
                  Edit Profile
                </button>
              )
            ) : (
              <button
                onClick={toggleFollow}
                className={`px-5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  profile.is_following
                    ? "border-[1.5px] border-rose-200 hover:border-rose-500 hover:text-rose-500"
                    : "gradient-bg text-white"
                }`}
              >
                {profile.is_following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-warm-800/50">
          <p className="text-sm">No posts yet.</p>
        </div>
      ) : (
        posts.map((p: any) => (
          <PostCard key={p.id} post={p} currentUserId={session?.user?.id} />
        ))
      )}
    </>
  );
}
