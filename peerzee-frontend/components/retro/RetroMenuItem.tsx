'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface RetroMenuItemProps {
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    children: React.ReactNode;
    isActive?: boolean;
    badge?: number | string;
    className?: string;
}

/**
 * RetroMenuItem - Cute Retro OS styled menu/navigation item
 * Features: Game cartridge button look, press effect
 */
export default function RetroMenuItem({
    href,
    onClick,
    icon,
    children,
    isActive = false,
    badge,
    className,
}: RetroMenuItemProps) {
    const baseStyles = clsx(
        'font-pixel uppercase tracking-wider text-base',
        'border-3 border-cocoa rounded-lg',
        'shadow-[2px_2px_0_0_#5A3E36]',
        'px-4 py-3',
        'flex items-center gap-3',
        'transition-all duration-100 ease-out',
        'cursor-pointer select-none',
        'w-full',
        isActive
            ? 'bg-pixel-pink text-cocoa translate-x-[2px] translate-y-[2px] shadow-none'
            : 'bg-white text-cocoa hover:bg-pixel-blue active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
        className
    );

    const content = (
        <>
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="flex-1 truncate">{children}</span>
            {badge !== undefined && (
                <span className="px-2 py-0.5 bg-pixel-pink border-2 border-cocoa rounded text-xs font-pixel">
                    {badge}
                </span>
            )}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={baseStyles}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={baseStyles}>
            {content}
        </button>
    );
}
