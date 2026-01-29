"use client";

import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Home, Search, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface VillageHeaderProps extends HTMLAttributes<HTMLElement> {
  logo?: ReactNode;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearchClick?: () => void;
  navItems?: Array<{ label: string; href: string; onClick?: () => void }>;
  rightContent?: ReactNode;
  userLevel?: number;
  userAvatar?: string;
  onUserClick?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

const VillageHeader = forwardRef<HTMLElement, VillageHeaderProps>(
  (
    {
      className,
      logo,
      title = "PEERZEE VILLAGE",
      subtitle = "EST. 2024 • POPULATION: 1,304",
      showSearch = true,
      searchPlaceholder = "Search notices...",
      onSearchChange,
      onSearchClick,
      navItems = [],
      rightContent,
      userLevel,
      userAvatar,
      onUserClick,
      showBack = false,
      onBack,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-50 w-full bg-[var(--wood-dark)] border-b-4 border-[var(--wood-shadow)] px-4 md:px-6 py-4",
          className
        )}
        {...props}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Back Button or Logo Section */}
          {showBack && onBack ? (
            <button onClick={onBack} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--cork)] border-3 border-[var(--border-dark)] flex items-center justify-center hover:bg-[var(--primary-orange)] transition-colors">
                <ArrowLeft className="w-7 h-7 text-[var(--parchment)]" />
              </div>
              <div>
                <h1 className="font-pixel text-xl md:text-2xl text-[var(--parchment)] tracking-wider">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-[var(--parchment-dark)] font-mono uppercase tracking-widest">
                    {subtitle}
                  </p>
                )}
              </div>
            </button>
          ) : (
          <Link href="/" className="flex items-center gap-4">
            {logo || (
              <div className="w-12 h-12 bg-[var(--primary-orange)] border-3 border-[var(--border-dark)] flex items-center justify-center">
                <Home className="w-7 h-7 text-[var(--parchment)]" />
              </div>
            )}
            <div>
              <h1 className="font-pixel text-xl md:text-2xl text-[var(--parchment)] tracking-wider">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[var(--parchment-dark)] font-mono uppercase tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          </Link>
          )}

          {/* Search Bar */}
          {showSearch && !showBack && (
            <button
              onClick={onSearchClick}
              className="hidden md:flex items-center gap-2 bg-[var(--wood-light)] border-3 border-[var(--border-dark)] px-4 py-2 hover:bg-[var(--wood-shadow)] transition-colors"
            >
              <Search className="w-5 h-5 text-[var(--parchment)]" />
              <span className="text-[var(--parchment-dark)] font-mono text-sm">{searchPlaceholder}</span>
            </button>
          )}

          {/* Right Content */}
          <div className="flex items-center gap-4">
            {/* Nav Links */}
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={item.onClick}
                    className="bg-[var(--wood-light)] hover:bg-[var(--primary-orange)] text-[var(--parchment)] px-4 py-2 font-pixel text-sm border-3 border-[var(--border-dark)] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
            
            {rightContent}
            
            {/* User Level Badge */}
            {userLevel !== undefined && (
              <div
                onClick={onUserClick}
                className="flex items-center gap-3 bg-[var(--wood-light)] border-3 border-[var(--border-dark)] px-4 py-2 cursor-pointer hover:bg-[var(--primary-orange)] transition-colors"
              >
                <span className="font-pixel text-sm text-[var(--parchment)]">
                  Adventurer<br />
                  <span className="text-[var(--accent-yellow)]">LVL {userLevel}</span>
                </span>
                {userAvatar ? (
                  <img src={userAvatar} alt="User" className="w-10 h-10 border-2 border-[var(--parchment)]" />
                ) : (
                  <div className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--parchment)] flex items-center justify-center">
                    <User className="w-6 h-6 text-[var(--parchment)]" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

VillageHeader.displayName = "VillageHeader";

export { VillageHeader };
