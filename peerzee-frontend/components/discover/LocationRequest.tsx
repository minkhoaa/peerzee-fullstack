'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { profileApi } from '@/lib/api';

interface LocationRequestProps {
    onLocationUpdate?: (lat: number, long: number) => void;
    onLocationGranted?: (coords: { lat: number; long: number }) => void;
    currentLocation?: { latitude?: number; longitude?: number } | null;
    compact?: boolean;
}

/**
 * LocationRequest - Retro Pixel OS styled location permission UI
 */
export function LocationRequest({ onLocationUpdate, onLocationGranted, currentLocation, compact = false }: LocationRequestProps) {
    const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error' | 'denied'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [coords, setCoords] = useState<{ lat: number; long: number } | null>(null);

    // Check if already has location
    useEffect(() => {
        if (currentLocation?.latitude && currentLocation?.longitude) {
            setCoords({ lat: currentLocation.latitude, long: currentLocation.longitude });
            setStatus('success');
        }
    }, [currentLocation]);

    const requestLocation = async () => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMessage('Trình duyệt không hỗ trợ định vị');
            return;
        }

        setStatus('requesting');
        setErrorMessage('');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, long: longitude });

                // Send to backend
                try {
                    await profileApi.updateProfile({ latitude, longitude });

                    setStatus('success');
                    onLocationUpdate?.(latitude, longitude);
                    onLocationGranted?.({ lat: latitude, long: longitude });
                } catch (err) {
                    console.error('Failed to save location:', err);
                    setStatus('error');
                    setErrorMessage('Không thể lưu vị trí');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                if (error.code === error.PERMISSION_DENIED) {
                    setStatus('denied');
                    setErrorMessage('Bạn đã từ chối quyền truy cập vị trí');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setStatus('error');
                    setErrorMessage('Không thể xác định vị trí');
                } else if (error.code === error.TIMEOUT) {
                    setStatus('error');
                    setErrorMessage('Hết thời gian chờ');
                } else {
                    setStatus('error');
                    setErrorMessage('Đã xảy ra lỗi');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // Cache for 1 minute
            }
        );
    };

    // Success state - compact display
    if (status === 'success' && coords) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel">
                <CheckCircle className="w-5 h-5 text-pixel-green" />
                <span className="text-cocoa text-sm font-bold">Đã bật định vị</span>
                <button
                    onClick={requestLocation}
                    className="ml-auto text-xs text-pixel-pink-dark hover:text-cocoa flex items-center gap-1 font-pixel uppercase tracking-widest"
                >
                    <Navigation className="w-3 h-3" />
                    Cập nhật
                </button>
            </div>
        );
    }

    // Error/Denied state
    if (status === 'error' || status === 'denied') {
        return (
            <div className="p-4 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-pixel-red" />
                    <span className="text-cocoa font-bold">{errorMessage}</span>
                </div>
                <button
                    onClick={requestLocation}
                    className="w-full py-2.5 bg-pixel-red text-cocoa text-sm font-pixel uppercase tracking-widest border-2 border-cocoa rounded-lg shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Requesting state
    if (status === 'requesting') {
        return (
            <div className="p-4 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                    <span className="text-cocoa font-bold">Đang xác định vị trí...</span>
                </div>
            </div>
        );
    }

    // Idle state - Call to action
    if (compact) {
        return (
            <button
                onClick={requestLocation}
                className="w-full px-4 py-4 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-pixel-pink" />
                    <span className="text-cocoa text-sm font-bold">Bật định vị để tìm gần bạn</span>
                </div>
                <span className="text-cocoa font-pixel uppercase tracking-widest text-xs bg-pixel-pink px-3 py-1.5 rounded-lg border-2 border-cocoa">BẬT</span>
            </button>
        );
    }

    return (
        <button
            onClick={requestLocation}
            className="w-full p-5 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel hover:translate-y-1 hover:shadow-pixel-sm transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pixel-pink border-3 border-cocoa flex items-center justify-center group-hover:scale-105 transition-transform shadow-pixel-sm">
                    <MapPin className="w-6 h-6 text-cocoa" />
                </div>
                <div className="text-left flex-1">
                    <p className="text-cocoa font-pixel uppercase tracking-widest text-lg">📍 Bật Định Vị</p>
                    <p className="text-cocoa-light text-sm font-bold">
                        Tìm người dùng gần bạn, xem khoảng cách
                    </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pixel-blue border-2 border-cocoa flex items-center justify-center shadow-pixel-sm group-hover:scale-105 transition-transform">
                    <Navigation className="w-5 h-5 text-cocoa" />
                </div>
            </div>
        </button>
    );
}
