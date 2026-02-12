export const POST_MAX_LENGTH = 280;
export const MSG_MAX_LENGTH = 1000;
export const SALT_ROUNDS = 12;
export const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 1200;

export const VALID_MOODS = [
  "none",
  "love",
  "happy",
  "sad",
  "angry",
  "anxious",
  "excited",
] as const;

export const VALID_REACTIONS = [
  "love",
  "haha",
  "sad",
  "angry",
  "fire",
] as const;

export const MOOD_MAP: Record<string, { label: string; emoji: string }> = {
  love: { label: "love", emoji: "❤️" },
  happy: { label: "happy", emoji: "😊" },
  sad: { label: "sad", emoji: "😢" },
  angry: { label: "angry", emoji: "😡" },
  anxious: { label: "anxious", emoji: "😰" },
  excited: { label: "excited", emoji: "🔥" },
};

export const REACTION_EMOJIS: Record<string, string> = {
  love: "❤️",
  haha: "😂",
  sad: "😢",
  angry: "😡",
  fire: "🔥",
};

export const NOTIF_MAP: Record<
  string,
  { icon: string; text: string }
> = {
  like: { icon: "❤️", text: "liked your post" },
  reply: { icon: "💬", text: "replied to your post" },
  follow: { icon: "💞", text: "started following you" },
  repost: { icon: "🔁", text: "reposted your post" },
  message: { icon: "💌", text: "sent you a message" },
  reaction: { icon: "✨", text: "reacted to your post" },
};
