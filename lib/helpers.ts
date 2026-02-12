export function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts + "Z").getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d";
  return new Date(ts + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function fmtCount(n: number): string {
  return n > 0 ? String(n) : "";
}
