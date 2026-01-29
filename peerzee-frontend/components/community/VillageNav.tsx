'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Map, Mail, Settings, ChevronRight } from 'lucide-react';

// ============================================
// VILLAGE THEME COLORS
// ============================================
const COLORS = {
  wood: '#8B5A2B',
  woodDark: '#4A3B32',
  woodLight: '#A0522D',
  text: '#FDF5E6',
  orange: '#E65100',
  orangeLight: '#FF6D00',
} as const;

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  isActive?: boolean;
}

interface VillageNavProps {
  activeRoute?: string;
  mailCount?: number;
}

/**
 * VillageNav - Left sidebar navigation
 * Wooden plank buttons style
 */
export function VillageNav({ activeRoute = '/community', mailCount = 0 }: VillageNavProps) {
  const router = useRouter();

  const navItems: NavItem[] = [
    { icon: Home, label: 'MY HOMESTEAD', href: '/profile' },
    { icon: Map, label: 'VILLAGE MAP', href: '/discover', isActive: activeRoute === '/discover' },
    { icon: Mail, label: 'MAILBOX', href: '/chat', badge: mailCount },
    { icon: Settings, label: 'SETTINGS', href: '/settings' },
  ];

  return (
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = activeRoute === item.href || item.isActive;
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className="w-full relative group"
          >
            {/* Wooden Plank Button */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-4 transition-all hover:translate-x-1 hover:-translate-y-0.5"
              style={{
                backgroundColor: isActive ? COLORS.orangeLight : COLORS.wood,
                borderColor: COLORS.woodDark,
                boxShadow: isActive 
                  ? `4px 4px 0px ${COLORS.woodDark}, inset 0 2px 0 rgba(255,255,255,0.2)`
                  : `3px 3px 0px ${COLORS.woodDark}`,
              }}
            >
              {/* Icon */}
              <div
                className="w-6 h-6 flex items-center justify-center"
                style={{ color: COLORS.text }}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Label */}
              <span
                className="font-pixel text-sm flex-1 text-left"
                style={{ color: COLORS.text }}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span
                  className="px-2 py-0.5 font-pixel text-xs rounded-sm border-2"
                  style={{
                    backgroundColor: COLORS.orange,
                    borderColor: COLORS.woodDark,
                    color: COLORS.text,
                  }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              {/* Arrow */}
              <ChevronRight
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: COLORS.text }}
              />
            </div>

            {/* Wood grain texture lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 8px,
                  rgba(0,0,0,0.1) 8px,
                  rgba(0,0,0,0.1) 9px
                )`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export default VillageNav;
