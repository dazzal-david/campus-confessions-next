type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs border-[1.5px]",
  md: "w-10 h-10 text-sm border-2",
  lg: "w-[72px] h-[72px] text-2xl border-[3px]",
};

export function Avatar({
  src,
  alt,
  size = "md",
}: {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
}) {
  const initial = alt ? alt[0].toUpperCase() : "?";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full shrink-0 flex items-center justify-center font-bold text-white border-rose-200 gradient-bg overflow-hidden`}
    >
      {src ? (
        <img src={src} alt={alt || ""} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}
