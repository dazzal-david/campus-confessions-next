"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, Repeat2, Heart, Bookmark, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { timeAgo, fmtCount } from "@/lib/helpers";
import { MOOD_MAP, REACTION_EMOJIS } from "@/lib/constants";

type Post = {
  id: number;
  user_id: number;
  text: string;
  mood: string;
  image_url: string | null;
  timestamp: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  like_count: number;
  reply_count: number;
  repost_count: number;
  user_liked: number;
  user_reposted: number;
  user_bookmarked: number;
  reactions: Record<string, number>;
  user_reactions: string[];
};

const moodStyles: Record<string, string> = {
  love: "bg-rose-100 text-rose-500",
  happy: "bg-amber-100 text-amber-600",
  sad: "bg-blue-100 text-blue-600",
  angry: "bg-red-100 text-red-600",
  anxious: "bg-purple-100 text-purple-600",
  excited: "bg-emerald-100 text-emerald-600",
};

const EMOJIS = [
  { type: "love", icon: "❤️" },
  { type: "haha", icon: "😂" },
  { type: "sad", icon: "😢" },
  { type: "angry", icon: "😡" },
  { type: "fire", icon: "🔥" },
];

export function PostCard({
  post,
  currentUserId,
  onDelete,
}: {
  post: Post;
  currentUserId?: string;
  onDelete?: (id: number) => void;
}) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(!!post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [reposted, setReposted] = useState(!!post.user_reposted);
  const [repostCount, setRepostCount] = useState(post.repost_count);
  const [bookmarked, setBookmarked] = useState(!!post.user_bookmarked);
  const [reactions, setReactions] = useState(post.reactions || {});
  const [userReactions, setUserReactions] = useState<string[]>(
    post.user_reactions || []
  );
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<
    {
      id: number;
      text: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      timestamp: string;
    }[]
  >([]);
  const [replyText, setReplyText] = useState("");
  const [replyCount, setReplyCount] = useState(post.reply_count);

  const isOwn = currentUserId && Number(currentUserId) === post.user_id;

  const toggleLike = async () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.like_count);
    }
  };

  const toggleRepost = async () => {
    setReposted(!reposted);
    setRepostCount(reposted ? repostCount - 1 : repostCount + 1);
    const res = await fetch(`/api/posts/${post.id}/repost`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setReposted(data.reposted);
      setRepostCount(data.repost_count);
      toast(data.reposted ? "Reposted!" : "Removed repost");
    }
  };

  const toggleBookmark = async () => {
    setBookmarked(!bookmarked);
    const res = await fetch(`/api/posts/${post.id}/bookmark`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
      toast(data.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks");
    }
  };

  const toggleReaction = async (type: string) => {
    const res = await fetch(`/api/posts/${post.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setReactions(data.reactions);
      if (data.reacted) {
        setUserReactions([...userReactions, type]);
      } else {
        setUserReactions(userReactions.filter((r) => r !== type));
      }
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies) {
      const res = await fetch(`/api/posts/${post.id}/replies`);
      if (res.ok) setReplies(await res.json());
    }
    setShowReplies(!showReplies);
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: replyText.trim() }),
    });
    if (res.ok) {
      setReplyText("");
      setReplyCount(replyCount + 1);
      const res2 = await fetch(`/api/posts/${post.id}/replies`);
      if (res2.ok) setReplies(await res2.json());
      toast("Reply posted!");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this confession?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete?.(post.id);
      toast("Deleted");
    }
  };

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-rose-100 hover:bg-rose-50/50 transition-colors animate-[fadeIn_0.3s_ease] group">
      <Link href={`/profile/${post.username}`}>
        <Avatar src={post.avatar_url} alt={post.display_name || post.username} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <Link
            href={`/profile/${post.username}`}
            className="font-bold text-sm hover:underline"
          >
            {post.display_name || post.username}
          </Link>
          <Link
            href={`/profile/${post.username}`}
            className="text-warm-800/50 text-xs"
          >
            @{post.username}
          </Link>
          <span className="text-warm-800/40 text-[10px]">·</span>
          <span className="text-warm-800/50 text-xs">
            {timeAgo(post.timestamp)}
          </span>
          {isOwn && (
            <button
              onClick={handleDelete}
              className="ml-auto opacity-0 group-hover:opacity-100 text-warm-800/40 hover:text-red-500 hover:bg-red-50 p-0.5 rounded text-xs transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {post.mood && post.mood !== "none" && MOOD_MAP[post.mood] && (
          <span
            className={`inline-block text-[11px] px-2 py-0.5 rounded-full mb-1 font-medium ${moodStyles[post.mood] || ""}`}
          >
            {MOOD_MAP[post.mood].emoji} {MOOD_MAP[post.mood].label}
          </span>
        )}

        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
          {post.text}
        </p>

        {post.image_url && (
          <div className="mt-2 rounded-xl overflow-hidden border border-rose-100">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full max-h-[400px] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Emoji reactions */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {EMOJIS.map((e) => {
            const count = reactions[e.type] || 0;
            const reacted = userReactions.includes(e.type);
            return (
              <button
                key={e.type}
                onClick={() => toggleReaction(e.type)}
                className={`h-7 px-2 rounded-full border text-xs flex items-center gap-1 transition-all hover:scale-105 ${
                  reacted
                    ? "bg-rose-100 border-rose-400"
                    : "bg-white border-rose-100 hover:bg-rose-100 hover:border-rose-400"
                }`}
              >
                {e.icon}
                {count > 0 && (
                  <span className="text-[10px] font-semibold">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action bar */}
        <div className="flex justify-between max-w-[400px] mt-1.5">
          <button
            onClick={handleToggleReplies}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-warm-800/50 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors"
          >
            <MessageCircle size={17} />
            <span>{fmtCount(replyCount)}</span>
          </button>
          <button
            onClick={toggleRepost}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
              reposted
                ? "text-emerald-500"
                : "text-warm-800/50 hover:text-emerald-500 hover:bg-emerald-500/10"
            }`}
          >
            <Repeat2 size={17} />
            <span>{fmtCount(repostCount)}</span>
          </button>
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
              liked
                ? "text-rose-500"
                : "text-warm-800/50 hover:text-rose-500 hover:bg-rose-500/10"
            }`}
          >
            <Heart
              size={17}
              className={liked ? "fill-rose-500 animate-[heartBurst_0.35s_ease]" : ""}
            />
            <span>{fmtCount(likeCount)}</span>
          </button>
          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
              bookmarked
                ? "text-indigo-500"
                : "text-warm-800/50 hover:text-indigo-500 hover:bg-indigo-500/10"
            }`}
          >
            <Bookmark
              size={17}
              className={bookmarked ? "fill-indigo-500" : ""}
            />
          </button>
        </div>

        {/* Replies section */}
        {showReplies && (
          <div className="mt-1">
            {replies.length === 0 ? (
              <p className="pl-[52px] text-warm-800/50 text-xs pt-2">
                No replies yet
              </p>
            ) : (
              replies.map((r) => (
                <div
                  key={r.id}
                  className="flex gap-2.5 pt-2.5 pl-[52px] border-t border-rose-100 first:border-t-0"
                >
                  <Avatar
                    src={r.avatar_url}
                    alt={r.display_name || r.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs">
                      {r.display_name || r.username}
                    </span>{" "}
                    <span className="text-warm-800/50 text-[11px]">
                      @{r.username}
                    </span>
                    <p className="text-xs leading-snug mt-0.5">{r.text}</p>
                    <p className="text-[10px] text-warm-800/40 mt-0.5">
                      {timeAgo(r.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="flex gap-2.5 pt-2 pl-[52px] border-t border-rose-100 items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Write a reply..."
                maxLength={280}
                className="flex-1 border border-rose-200 rounded-full px-3.5 py-1.5 text-xs outline-none focus:border-rose-500 bg-warm-50"
              />
              <button
                onClick={sendReply}
                className="px-3.5 py-1.5 gradient-bg text-white rounded-full font-bold text-xs"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
