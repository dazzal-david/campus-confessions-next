"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { ImageIcon, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { MOOD_MAP } from "@/lib/constants";

const MOODS = Object.keys(MOOD_MAP);
const MAX = 280;
const CIRCUMFERENCE = 2 * Math.PI * 11;

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [mood, setMood] = useState("none");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pct = text.length / MAX;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!text.trim() || text.length > MAX) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("text", text.trim());
    formData.append("mood", mood);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch("/api/posts", { method: "POST", body: formData });
      if (res.ok) {
        setText("");
        setMood("none");
        removeImage();
        toast("Confessed!");
        onPostCreated();
      }
    } catch {
      toast("Failed to post");
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-rose-200">
      <Avatar
        src={session?.user?.image}
        alt={session?.user?.name || session?.user?.username}
      />
      <div className="flex-1 min-w-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === "Enter" && text.trim() && text.length <= MAX) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="What's on your heart?"
          maxLength={MAX}
          rows={2}
          className="w-full border-none outline-none text-[15px] resize-none min-h-12 leading-snug bg-transparent placeholder:text-rose-300"
        />
        {imagePreview && (
          <div className="relative inline-block mt-2 rounded-xl overflow-hidden">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-48 rounded-xl"
            />
            <button
              onClick={removeImage}
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex gap-1.5 flex-wrap py-1.5">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? "none" : m)}
              className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-all ${
                mood === m
                  ? "bg-rose-100 border-rose-400 text-rose-500"
                  : "bg-white border-rose-200 text-warm-800/50 hover:bg-rose-50"
              }`}
            >
              {MOOD_MAP[m].emoji} {MOOD_MAP[m].label}
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-rose-100">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer text-rose-500 flex items-center p-1 rounded-full hover:bg-rose-100 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                hidden
              />
              <ImageIcon size={20} />
            </label>
            <div className="w-[26px] h-[26px] relative">
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                className="-rotate-90"
              >
                <circle
                  cx="13"
                  cy="13"
                  r="11"
                  fill="none"
                  strokeWidth="2.5"
                  className="stroke-rose-100"
                />
                <circle
                  cx="13"
                  cy="13"
                  r="11"
                  fill="none"
                  strokeWidth="2.5"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
                  className={`transition-all duration-200 ${
                    pct >= 1
                      ? "stroke-red-500"
                      : pct > 0.9
                        ? "stroke-amber-500"
                        : "stroke-rose-500"
                  }`}
                />
              </svg>
            </div>
          </div>
          <button
            onClick={submit}
            disabled={!text.trim() || text.length > MAX || loading}
            className="px-5 py-1.5 gradient-bg text-white rounded-full font-bold text-sm shadow-md shadow-rose-500/30 hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? "..." : "Confess"}
          </button>
        </div>
      </div>
    </div>
  );
}
