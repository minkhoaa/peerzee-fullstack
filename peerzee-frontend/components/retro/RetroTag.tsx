'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RetroTagProps {
    children: React.ReactNode;
    variant?: 'blue' | 'pink' | 'yellow' | 'green';
    onClick?: () => void;
    className?: string;
}

/**
 * RetroTag - Cute Retro OS styled tag/badge
 * Features: Pixel font, thick border, press effect
 */
export default function RetroTag({
    children,
    variant = 'blue',
    onClick,
    className,
}: RetroTagProps) {
    const variantStyles = {
        blue: 'bg-pixel-blue hover:bg-[#9DE5FF]',
        pink: 'bg-pixel-pink hover:bg-pixel-pink-dark',
        yellow: 'bg-pixel-yellow hover:bg-[#FFD93D]',
        green: 'bg-pixel-green hover:bg-[#7DC96E]',
    };

    return (
        <span
            onClick={onClick}
            className={clsx(
                'inline-flex items-center gap-1',
                'font-pixel text-sm uppercase',
                'border-2 border-cocoa rounded-md',
                'px-3 py-1',
                'shadow-[2px_2px_0_0_#5A3E36]',
                'transition-all duration-100 ease-out',
                onClick && 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                'text-cocoa',
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}

/**
 * RetroHearts - HP/Affinity display with pixel hearts
 */
interface RetroHeartsProps {
    current: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function RetroHearts({ current, max = 5, size = 'md' }: RetroHeartsProps) {
    const sizeStyles = {
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
    };

    return (
        <div className={clsx('flex items-center gap-0.5', sizeStyles[size])}>
            {Array.from({ length: max }).map((_, i) => (
                <span
                    key={i}
                    className={clsx(
                        'transition-all duration-150',
                        i < current ? 'text-pixel-red' : 'text-cocoa-light/40'
                    )}
                >
                    ♥
                </span>
            ))}
        </div>
    );
}

/**
 * RetroBadge - Small status badge
 */
interface RetroBadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function RetroBadge({ children, variant = 'default' }: RetroBadgeProps) {
    const variantStyles = {
        default: 'bg-pixel-pink',
        success: 'bg-pixel-green',
        warning: 'bg-pixel-yellow',
        danger: 'bg-pixel-red text-white',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center',
                'font-pixel text-xs',
                'border-2 border-cocoa rounded',
                'px-2 py-0.5',
                'text-cocoa',
                variantStyles[variant]
            )}
        >
            {children}
        </span>
    );
}
