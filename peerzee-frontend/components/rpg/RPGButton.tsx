'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RPGButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

/**
 * RPGButton - Pixel RPG styled button component
 * Features: 2px solid border, pixel shadow, press animation
 */
export default function RPGButton({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'left',
    className,
    disabled,
    ...props
}: RPGButtonProps) {
    const baseStyles = `
        font-display font-semibold
        border-2 border-rpg-brown
        transition-all duration-100
        active:translate-y-[2px] active:shadow-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0
    `;

    const variantStyles = {
        primary: 'bg-primary text-white shadow-[2px_2px_0_0_#4a3b32] hover:bg-primary/90',
        secondary: 'bg-white text-rpg-brown shadow-[2px_2px_0_0_#4a3b32] hover:bg-rpg-blue',
        danger: 'bg-red-500 text-white shadow-[2px_2px_0_0_#4a3b32] hover:bg-red-600',
        ghost: 'bg-transparent text-rpg-brown border-transparent shadow-none hover:bg-rpg-blue/50',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
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
