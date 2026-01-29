'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

/**
 * RetroButton - Cute Retro OS styled button
 * Features: Thick cocoa borders, hard pixel shadow, press effect
 */
export default function RetroButton({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'left',
    className,
    disabled,
    ...props
}: RetroButtonProps) {
    const baseStyles = `
        font-pixel uppercase tracking-wider
        border-3 border-cocoa
        transition-all duration-100 ease-out
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
        rounded-lg
        cursor-pointer
        select-none
    `;

    const variantStyles = {
        primary: 'bg-pixel-pink text-cocoa shadow-[2px_2px_0_0_#5A3E36] hover:bg-pixel-pink-dark',
        secondary: 'bg-white text-cocoa shadow-[2px_2px_0_0_#5A3E36] hover:bg-pixel-blue',
        ghost: 'bg-transparent text-cocoa border-transparent shadow-none hover:bg-pixel-blue/50',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={clsx(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled}
            {...props}
        >
            <span className="flex items-center justify-center gap-2">
                {icon && iconPosition === 'left' && icon}
                {children}
                {icon && iconPosition === 'right' && icon}
            </span>
        </button>
    );
}
