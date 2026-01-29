'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RPGCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'window' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * RPGCard - Pixel RPG styled card/container component
 * Features: 4px border, pixel aesthetic, optional window-style header
 */
export default function RPGCard({
    children,
    variant = 'default',
    padding = 'md',
    className,
    ...props
}: RPGCardProps) {
    const variantStyles = {
        default: 'bg-retro-white border-3 border-cocoa shadow-pixel',
        window: 'bg-retro-white border-3 border-cocoa shadow-pixel',
        flat: 'bg-retro-white border-2 border-cocoa',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            className={clsx(
                variantStyles[variant],
                paddingStyles[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface RPGWindowProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
    headerActions?: React.ReactNode;
}

/**
 * RPGWindow - Pixel RPG styled window container
 * Features: Title bar with pixel aesthetic, classic window chrome
 */
export function RPGWindow({
    children,
    title,
    className,
    headerActions,
}: RPGWindowProps) {
    return (
        <div className={clsx(
            'bg-retro-white border-3 border-cocoa shadow-pixel',
            className
        )}>
            {/* Window title bar */}
            {title && (
                <div className="bg-cocoa px-4 py-2 flex items-center justify-between">
                    <span className="font-pixel font-bold text-retro-white text-sm">
                        {title}
                    </span>
                    {headerActions}
                </div>
            )}
            {children}
        </div>
    );
}
