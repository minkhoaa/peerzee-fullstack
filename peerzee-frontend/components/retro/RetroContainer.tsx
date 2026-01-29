'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RetroContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'default' | 'window' | 'card';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    noBorder?: boolean;
}

/**
 * RetroContainer - Cute Retro OS styled container/card
 * Features: Thick cocoa border, rounded corners, hard shadow
 */
export default function RetroContainer({
    children,
    variant = 'default',
    padding = 'md',
    noBorder = false,
    className,
    ...props
}: RetroContainerProps) {
    const baseStyles = `
        bg-retro-paper
        rounded-xl
        overflow-hidden
    `;

    const variantStyles = {
        default: noBorder ? '' : 'border-4 border-cocoa shadow-[4px_4px_0_0_#8D6E63]',
        window: noBorder ? '' : 'border-4 border-cocoa shadow-[4px_4px_0_0_#5A3E36]',
        card: noBorder ? '' : 'border-3 border-cocoa shadow-[3px_3px_0_0_#8D6E63]',
    };

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
    };

    return (
        <div
            className={clsx(
                baseStyles,
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

interface RetroWindowProps {
    children: React.ReactNode;
    title?: string;
    titleIcon?: React.ReactNode;
    className?: string;
    headerActions?: React.ReactNode;
}

/**
 * RetroWindow - Window-style container with title bar
 * Features: Title bar like classic OS windows
 */
export function RetroWindow({
    children,
    title,
    titleIcon,
    className,
    headerActions,
}: RetroWindowProps) {
    return (
        <div className={clsx(
            'bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] overflow-hidden',
            className
        )}>
            {/* Window Title Bar */}
            {title && (
                <div className="bg-pixel-pink border-b-4 border-cocoa px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {titleIcon}
                        <span className="font-pixel text-cocoa text-lg uppercase tracking-wider">
                            {title}
                        </span>
                    </div>
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
