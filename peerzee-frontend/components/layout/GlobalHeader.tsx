"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Star, 
  MessageSquareText, 
  IdCard, 
  Globe, 
  Search,
  LogOut,
  Users,
  Scroll
} from "lucide-react";
import NotificationPopover from "@/components/NotificationPopover";

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
  { href: "/discover", icon: <Globe size={18} strokeWidth={2.5} />, label: "Discover" },
  { href: "/match", icon: <Search size={18} strokeWidth={2.5} />, label: "Match" },
  { href: "/chat", icon: <MessageSquareText size={18} strokeWidth={2.5} />, label: "Chat" },
  { href: "/community", icon: <Users size={18} strokeWidth={2.5} />, label: "Community" },
  { href: "/likers", icon: <Star size={18} strokeWidth={2.5} />, label: "Likers" },
  { href: "/profile", icon: <IdCard size={18} strokeWidth={2.5} />, label: "Profile" },
];

export default function GlobalHeader({ title, subtitle, action }: GlobalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-wood-dark border-b-4 border-wood-shadow shadow-wood">
      {/* Wood grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            rgba(0,0,0,0.1) 20px,
            rgba(0,0,0,0.1) 21px
          )`
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="flex items-center justify-between h-14">
          {/* Logo Plaque */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Logo Emblem */}
            <div className="relative">
              <div className="w-10 h-10 bg-pixel-orange border-3 border-wood-shadow rounded-sm shadow-pixel-sm flex items-center justify-center group-hover:brightness-110 transition-all">
                <Scroll size={22} strokeWidth={2.5} className="text-parchment" />
              </div>
              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l-2 border-t-2 border-parchment/50" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r-2 border-t-2 border-parchment/50" />
              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l-2 border-b-2 border-parchment/50" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r-2 border-b-2 border-parchment/50" />
            </div>
            <span className="font-pixel text-2xl text-parchment tracking-widest hidden sm:block drop-shadow-sm">
              PEERZEE
            </span>
          </Link>

          {/* Navigation - Wood Beam Buttons */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-1.5 px-2 sm:px-3 py-1.5 font-pixel text-sm uppercase tracking-wider
                    border-2 transition-all duration-100
                    ${isActive 
                      ? "bg-pixel-orange border-wood-shadow text-parchment shadow-pixel-sm" 
                      : "bg-wood-medium border-wood-shadow text-parchment/80 hover:bg-wood-light hover:text-parchment"
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
            {/* Notification Bell with Popover */}
            <NotificationPopover />

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="p-2 bg-wood-medium border-2 border-wood-shadow shadow-pixel-sm hover:bg-pixel-red transition-colors active:translate-y-0.5 active:shadow-none"
            >
              <LogOut size={18} strokeWidth={2.5} className="text-parchment" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Nail/Rivet Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-around items-center px-8">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-wood-shadow border border-wood-light/30" />
        ))}
      </div>
    </header>
  );
}
