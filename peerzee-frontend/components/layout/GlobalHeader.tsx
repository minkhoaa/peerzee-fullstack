"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Star, 
  MessageSquareText, 
  IdCard, 
  Globe, 
  Search,
  LogOut,
  Users,
  Bell,
  Monitor
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface GlobalHeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Formal Icon System: strokeWidth={2.5} for thick Retro look
// Video mode is now integrated into Match (Arcade Lobby)
const navItems: NavItem[] = [
  { href: "/discover", icon: <Globe size={20} strokeWidth={2.5} />, label: "Discover" },
  { href: "/match", icon: <Search size={20} strokeWidth={2.5} />, label: "Match" },
  { href: "/chat", icon: <MessageSquareText size={20} strokeWidth={2.5} />, label: "Chat" },
  { href: "/community", icon: <Users size={20} strokeWidth={2.5} />, label: "Community" },
  { href: "/likers", icon: <Star size={20} strokeWidth={2.5} />, label: "Likers" },
  { href: "/profile", icon: <IdCard size={20} strokeWidth={2.5} />, label: "Profile" },
];

export default function GlobalHeader({ title, subtitle, action }: GlobalHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-retro-white border-b-3 border-cocoa shadow-pixel">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-pixel-pink border-3 border-cocoa rounded-lg shadow-pixel-sm flex items-center justify-center group-hover:bg-pixel-pink-dark transition-colors">
              <Monitor size={24} strokeWidth={2.5} className="text-cocoa" />
            </div>
            <span className="font-pixel text-2xl text-cocoa tracking-widest hidden sm:block">
              PEERZEE
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg font-pixel text-sm uppercase tracking-wider
                    border-3 transition-all duration-100
                    ${isActive 
                      ? "bg-pixel-pink border-cocoa shadow-pixel-sm text-cocoa" 
                      : "bg-retro-white border-transparent hover:border-cocoa hover:shadow-pixel-sm text-cocoa-light hover:text-cocoa"
                    }
                    active:translate-y-0.5 active:shadow-none
                  `}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button className="relative p-2 bg-pixel-blue border-3 border-cocoa rounded-lg shadow-pixel-sm hover:bg-pixel-pink transition-colors active:translate-y-0.5 active:shadow-none">
              <Bell size={20} strokeWidth={2.5} className="text-cocoa" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-pixel-red border-2 border-cocoa rounded-full flex items-center justify-center">
                <span className="font-pixel text-xs text-white">3</span>
              </span>
            </button>

            {/* Logout */}
            <button className="p-2 bg-retro-paper border-3 border-cocoa rounded-lg shadow-pixel-sm hover:bg-pixel-red hover:text-white transition-colors active:translate-y-0.5 active:shadow-none">
              <LogOut size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Pixel Line */}
      <div className="h-1 bg-gradient-to-r from-pixel-pink via-pixel-blue to-pixel-green" />
    </header>
  );
}
