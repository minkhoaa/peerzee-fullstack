'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Home, Search, MessageCircle, User, Settings, LogOut, Bell, ChevronLeft } from 'lucide-react';

// ============================================
// GLOBAL HEADER PROPS
// ============================================
export interface GlobalHeaderProps {
  /** Page title - e.g., "TAVERN CHAT", "QUEST BOARD" */
  title?: string;
  /** Subtitle text - e.g., "Level 3 • Adventurer" */
  subtitle?: string;
  /** Show hamburger menu on mobile */
  showMenu?: boolean;
  /** Show back button instead of logo */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Optional right-side action button/component */
  action?: React.ReactNode;
  /** Show notification bell */
  showNotifications?: boolean;
  /** Notification count */
  notificationCount?: number;
}

// ============================================
// VILLAGE THEME COLORS (STRICT)
// ============================================
const COLORS = {
  woodDark: '#4A3B32',
  woodShadow: '#261E1A',
  woodMedium: '#6B5344',
  cork: '#E0C097',
  corkDark: '#AC7F55',
  primary: '#EC4913',
  primaryDark: '#B0320A',
  parchment: '#FDF5E6',
  accent: '#D4A373',
} as const;

// ============================================
// NAVIGATION ITEMS
// ============================================
const NAV_ITEMS = [
  { icon: Home, label: 'HOME', href: '/' },
  { icon: Search, label: 'DISCOVER', href: '/discover' },
  { icon: MessageCircle, label: 'CHAT', href: '/chat' },
  { icon: User, label: 'PROFILE', href: '/profile' },
  { icon: Settings, label: 'SETTINGS', href: '/settings' },
];

/**
 * GlobalHeader - Unified header component ("The HUD")
 * Wood texture, Pixel font, Quest Log style
 * Must be used on ALL pages for visual consistency
 */
export function GlobalHeader({
  title = 'PEERZEE',
  subtitle,
  showMenu = true,
  showBack = false,
  onBack,
  action,
  showNotifications = true,
  notificationCount = 0,
}: GlobalHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const avatar = localStorage.getItem('userAvatar');
    const level = localStorage.getItem('userLevel');
    
    setIsLoggedIn(!!token);
    if (avatar) setUserAvatar(avatar);
    if (level) setUserLevel(parseInt(level) || 1);
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Main Header */}
      <header
        className="h-16 w-full flex items-center justify-between px-4 sticky top-0 z-50"
        style={{
          backgroundColor: COLORS.woodDark,
          borderBottom: `4px solid ${COLORS.woodShadow}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {/* Back Button or Logo */}
          {showBack ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: COLORS.woodMedium,
                borderColor: COLORS.woodShadow,
              }}
            >
              <ChevronLeft className="w-6 h-6" style={{ color: COLORS.parchment }} />
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-3">
              {/* Logo Icon - Castle/Shield */}
              <div
                className="w-10 h-10 flex items-center justify-center border-2 rounded-sm"
                style={{
                  backgroundColor: COLORS.primary,
                  borderColor: COLORS.primaryDark,
                }}
              >
                <span className="text-xl">🏰</span>
              </div>
            </Link>
          )}

          {/* Title & Subtitle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="font-pixel text-lg md:text-xl uppercase tracking-widest"
                style={{
                  color: COLORS.cork,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                PEERZEE
              </span>
              {title && title !== 'PEERZEE' && (
                <>
                  <span style={{ color: COLORS.corkDark }}>•</span>
                  <span
                    className="font-pixel text-sm md:text-lg uppercase tracking-wide"
                    style={{ color: COLORS.accent }}
                  >
                    {title}
                  </span>
                </>
              )}
            </div>
            {subtitle && (
              <span
                className="text-[10px] md:text-xs font-bold uppercase tracking-widest"
                style={{ color: COLORS.corkDark }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right Section - User HUD */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Custom Action */}
          {action}

          {/* Notifications */}
          {showNotifications && isLoggedIn && (
            <button
              onClick={() => router.push('/notifications')}
              className="relative w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: COLORS.woodMedium,
                borderColor: COLORS.woodShadow,
              }}
            >
              <Bell className="w-5 h-5" style={{ color: COLORS.parchment }} />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center font-pixel text-[10px] rounded-full border-2"
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primaryDark,
                    color: COLORS.parchment,
                  }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Level Badge (Desktop) */}
          {isLoggedIn && (
            <div
              className="hidden md:flex items-center gap-1 px-2 py-1 border-2"
              style={{
                backgroundColor: COLORS.woodMedium,
                borderColor: COLORS.woodShadow,
              }}
            >
              <span className="text-sm" style={{ color: COLORS.accent }}>⚔️</span>
              <span
                className="font-pixel text-sm"
                style={{ color: COLORS.accent }}
              >
                LVL {userLevel}
              </span>
            </div>
          )}

          {/* User Avatar */}
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-sm border-2 overflow-hidden"
              style={{
                borderColor: COLORS.corkDark,
                backgroundColor: COLORS.accent,
              }}
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-2 font-pixel text-xs uppercase border-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primaryDark,
                color: COLORS.parchment,
              }}
            >
              LOGIN
            </button>
          )}

          {/* Mobile Menu Toggle */}
          {showMenu && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center border-2"
              style={{
                backgroundColor: COLORS.woodMedium,
                borderColor: COLORS.woodShadow,
              }}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" style={{ color: COLORS.parchment }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: COLORS.parchment }} />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div
            className="fixed top-16 right-0 w-64 h-[calc(100vh-64px)] z-50 md:hidden border-l-4 overflow-y-auto"
            style={{
              backgroundColor: COLORS.woodDark,
              borderColor: COLORS.woodShadow,
            }}
          >
            {/* User Info */}
            {isLoggedIn && (
              <div
                className="p-4 border-b-2"
                style={{ borderColor: COLORS.woodShadow }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-sm border-2 overflow-hidden"
                    style={{
                      borderColor: COLORS.corkDark,
                      backgroundColor: COLORS.accent,
                    }}
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <div>
                    <p className="font-pixel text-sm" style={{ color: COLORS.cork }}>
                      ADVENTURER
                    </p>
                    <p className="text-xs" style={{ color: COLORS.corkDark }}>
                      Level {userLevel}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="p-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mb-1 border-2 transition-all hover:opacity-80"
                  style={{
                    backgroundColor: COLORS.woodMedium,
                    borderColor: COLORS.woodShadow,
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: COLORS.cork }} />
                  <span className="font-pixel text-sm" style={{ color: COLORS.cork }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            {isLoggedIn && (
              <div className="p-2 mt-auto">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 transition-all hover:opacity-80"
                  style={{
                    backgroundColor: '#8B0000',
                    borderColor: '#5C0000',
                  }}
                >
                  <LogOut className="w-5 h-5" style={{ color: COLORS.parchment }} />
                  <span className="font-pixel text-sm" style={{ color: COLORS.parchment }}>
                    LOGOUT
                  </span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default GlobalHeader;
