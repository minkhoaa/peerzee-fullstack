'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

// ============================================
// PIXEL TOGGLE - ON/OFF Switch
// ============================================
interface PixelToggleProps {
    id?: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function PixelToggle({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: PixelToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                <label
                    htmlFor={id}
                    className="font-body text-sm font-bold text-cocoa cursor-pointer"
                >
                    {label}
                </label>
                {description && (
                    <p className="text-xs text-cocoa-light font-body mt-1">
                        {description}
                    </p>
                )}
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={clsx(
                    'relative shrink-0 w-14 h-7',
                    'border-3 border-cocoa rounded-lg',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-pixel-pink focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    checked ? 'bg-pixel-green' : 'bg-cocoa-light/30',
                    'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.2)]'
                )}
            >
                {/* Sliding Thumb */}
                <span
                    className={clsx(
                        'absolute top-0.5 w-5 h-5',
                        'bg-retro-white border-2 border-cocoa',
                        'transition-all duration-200',
                        'shadow-[2px_2px_0_0_rgba(90,62,54,0.3)]',
                        checked ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'
                    )}
                />
            </button>
        </div>
    );
}

// ============================================
// VOLUME SLIDER - Custom Range Input
// ============================================
interface VolumeSliderProps {
    id?: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    disabled?: boolean;
}

export function VolumeSlider({
    id,
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    disabled = false,
}: VolumeSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="font-body text-sm font-bold text-cocoa">
                    {label}
                </label>
                <span className="font-pixel text-lg text-cocoa">{value}</span>
            </div>
            <div className="relative">
                {/* Track Background */}
                <div className="h-3 bg-retro-white border-3 border-cocoa rounded relative overflow-hidden shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15)]">
                    {/* Fill */}
                    <div
                        className="absolute inset-y-0 left-0 bg-pixel-green/40 transition-all duration-150"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {/* Range Input (invisible but functional) */}
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    style={{ height: '48px', top: '-18px' }}
                />
                {/* Visual Thumb */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-pixel-pink border-3 border-cocoa shadow-[2px_2px_0_0_#62544B] pointer-events-none transition-all duration-150"
                    style={{ left: `calc(${percentage}% - 12px)` }}
                />
            </div>
        </div>
    );
}

// ============================================
// RETRO SELECT - Dropdown
// ============================================
interface RetroSelectProps {
    id?: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    disabled?: boolean;
}

export function RetroSelect({
    id,
    label,
    value,
    onChange,
    options,
    disabled = false,
}: RetroSelectProps) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="font-body text-sm font-bold text-cocoa">
                {label}
            </label>
            <div className="relative">
                <select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={clsx(
                        'w-full appearance-none',
                        'font-body text-sm text-cocoa',
                        'bg-retro-white',
                        'border-3 border-cocoa rounded-lg',
                        'px-4 py-3 pr-10',
                        'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15)]',
                        'focus:outline-none focus:shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15),0_0_0_3px_#BBEFFF]',
                        'transition-shadow duration-150',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'cursor-pointer'
                    )}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {/* Custom Arrow */}
                <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa pointer-events-none"
                    strokeWidth={3}
                />
            </div>
        </div>
    );
}

// ============================================
// RETRO INPUT (Enhanced) - Text Input
// ============================================
interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    readOnly?: boolean;
}

export function RetroInput({
    id,
    label,
    error,
    readOnly = false,
    className,
    ...props
}: RetroInputProps) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="font-body text-sm font-bold text-cocoa">
                {label}
            </label>
            <input
                id={id}
                readOnly={readOnly}
                className={clsx(
                    'w-full font-body text-sm',
                    'border-3 border-cocoa rounded-lg',
                    'bg-retro-white text-cocoa placeholder-cocoa-light',
                    'px-4 py-3',
                    'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15)]',
                    'transition-shadow duration-150',
                    error && 'border-pixel-red',
                    readOnly
                        ? 'bg-cocoa-light/10 cursor-not-allowed'
                        : 'focus:outline-none focus:shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.15),0_0_0_3px_#BBEFFF]',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-xs font-body text-pixel-red">{error}</p>
            )}
        </div>
    );
}
