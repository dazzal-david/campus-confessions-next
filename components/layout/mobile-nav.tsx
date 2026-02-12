"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, Bookmark, Mail, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const username = session?.user?.username || "";

  const items = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/bookmarks", icon: Bookmark, label: "Saved" },
    { href: "/messages", icon: Mail, label: "DMs" },
    { href: `/profile/${username}`, icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[600px] w-full bg-rose-50/95 backdrop-blur-md border-t border-rose-200 flex z-50">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive
                ? "text-rose-500"
                : "text-warm-800/50 hover:text-rose-500"
            }`}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
