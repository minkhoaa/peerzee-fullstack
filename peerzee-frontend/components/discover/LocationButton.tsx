'use client';

import React, { useState } from 'react';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { profileApi } from '@/lib/api';

interface LocationButtonProps {
    onLocationUpdate?: (lat: number, long: number) => void;
    className?: string;
}

/**
 * LocationButton - Retro Pixel OS styled location update button
 */
export function LocationButton({ onLocationUpdate, className = '' }: LocationButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const updateLocation = async () => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Trình duyệt không hỗ trợ định vị');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    await profileApi.updateProfile({ latitude, longitude });

                    setStatus('success');
                    onLocationUpdate?.(latitude, longitude);

                    // Reset to idle after 2s
                    setTimeout(() => setStatus('idle'), 2000);
                } catch {
                    setStatus('error');
                    setErrorMsg('Không thể cập nhật vị trí');
                }
            },
            (error) => {
                setStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    setErrorMsg('Bạn đã từ chối quyền định vị');
                } else {
                    setErrorMsg('Không thể xác định vị trí');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    if (status === 'error') {
        return (
            <button
                onClick={updateLocation}
                className={`flex items-center gap-2 px-4 py-2 bg-pixel-red text-cocoa border-2 border-cocoa rounded-lg shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all font-bold ${className}`}
            >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{errorMsg || 'Thử lại'}</span>
            </button>
        );
    }

    if (status === 'success') {
        return (
            <div className={`flex items-center gap-2 px-4 py-2 bg-pixel-green text-cocoa border-2 border-cocoa rounded-lg shadow-pixel-sm font-bold ${className}`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Đã cập nhật</span>
            </div>
        );
    }

    return (
        <button
            onClick={updateLocation}
            disabled={status === 'loading'}
            className={`flex items-center gap-2 px-4 py-2 bg-pixel-blue text-cocoa border-2 border-cocoa rounded-lg shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
            {status === 'loading' ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Đang cập nhật...</span>
                </>
            ) : (
                <>
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Cập nhật vị trí</span>
                </>
            )}
        </button>
    );
}
