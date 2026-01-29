'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: string;
}

/**
 * RetroInput - Cute Retro OS styled input field
 * Features: Thick cocoa border, inset shadow, pixel font placeholder
 */
export default function RetroInput({
    icon,
    error,
    className,
    ...props
}: RetroInputProps) {
    return (
        <div className="relative w-full">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-light">
                    {icon}
                </div>
            )}
            <input
                className={clsx(
                    'w-full font-body text-sm',
                    'border-3 border-cocoa rounded-lg',
                    'bg-white text-cocoa placeholder-cocoa-light',
                    'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15)]',
                    'focus:outline-none focus:shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15),0_0_0_3px_#BBEFFF]',
                    'transition-shadow duration-150',
                    'py-3',
                    icon ? 'pl-11 pr-4' : 'px-4',
                    error && 'border-pixel-red',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs font-body text-pixel-red">{error}</p>
            )}
        </div>
    );
}

interface RetroTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

/**
 * RetroTextarea - Cute Retro OS styled textarea
 */
export function RetroTextarea({
    error,
    className,
    ...props
}: RetroTextareaProps) {
    return (
        <div className="relative w-full">
            <textarea
                className={clsx(
                    'w-full font-body text-sm',
                    'border-3 border-cocoa rounded-lg',
                    'bg-white text-cocoa placeholder-cocoa-light',
                    'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15)]',
                    'focus:outline-none focus:shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15),0_0_0_3px_#BBEFFF]',
                    'transition-shadow duration-150',
                    'p-4 resize-none',
                    error && 'border-pixel-red',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs font-body text-pixel-red">{error}</p>
            )}
        </div>
    );
}
