'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Map, Mail, Settings, ChevronRight } from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
 * Paper Cards style - Fresh Sage & Cool Taupe palette
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
    <div className="space-y-3">
      {navItems.map((item) => {
        const isActive = activeRoute === item.href || item.isActive;
        const Icon = item.icon;

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 
              border-3 border-cocoa shadow-pixel
              transition-all duration-150
              ${isActive 
                ? 'bg-cocoa text-white' 
                : 'bg-retro-paper text-cocoa hover:bg-retro-white hover:-translate-y-1'
              }
            `}
          >
            {/* Icon */}
            <Icon 
              className={`w-5 h-5 ${isActive ? 'text-white' : 'text-cocoa'}`} 
              strokeWidth={2.5} 
            />

            {/* Label */}
            <span className="font-pixel text-sm flex-1 text-left uppercase font-bold">
              {item.label}
            </span>

            {/* Badge */}
            {item.badge && item.badge > 0 && (
              <span className={`
                px-2 py-0.5 font-pixel text-xs border-2 border-cocoa font-bold
                ${isActive ? 'bg-pixel-pink text-cocoa' : 'bg-pixel-pink text-cocoa'}
              `}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}

            {/* Arrow */}
            <ChevronRight
              className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-white' : 'text-cocoa'}`}
              strokeWidth={2.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export default VillageNav;
