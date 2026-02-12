"use client";

import { useEffect, useRef } from "react";

const hearts = ["❤️", "💖", "💗", "💕", "❣️", "🩷"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    for (let i = 0; i < 12; i++) {
      const h = document.createElement("div");
      h.className = "fixed pointer-events-none z-0 opacity-0";
      h.style.animation = `floatUp ${4 + Math.random() * 3}s linear ${Math.random() * 5}s infinite`;
      h.style.left = Math.random() * 100 + "%";
      h.style.fontSize = (0.8 + Math.random() * 1.2) + "em";
      h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      container.appendChild(h);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center gradient-soft relative overflow-hidden"
    >
      <div className="z-10 w-full max-w-[380px] mx-4">{children}</div>
    </div>
  );
}
