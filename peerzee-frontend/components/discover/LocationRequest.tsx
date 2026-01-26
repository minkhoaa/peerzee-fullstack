'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';

interface LocationRequestProps {
    onLocationUpdate?: (lat: number, long: number) => void;
    onLocationGranted?: (coords: { lat: number; long: number }) => void;
    currentLocation?: { latitude?: number; longitude?: number } | null;
    compact?: boolean;
}

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
                    const token = localStorage.getItem('token');
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/profile/me`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ latitude, longitude }),
                        }
                    );

                    if (!res.ok) {
                        throw new Error('Failed to update location');
                    }

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
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-400 text-sm font-medium">Đã bật định vị</span>
                <button
                    onClick={requestLocation}
                    className="ml-auto text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
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
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">{errorMessage}</span>
                </div>
                <button
                    onClick={requestLocation}
                    className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Requesting state
    if (status === 'requesting') {
        return (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-blue-400 font-medium">Đang xác định vị trí...</span>
                </div>
            </div>
        );
    }

    // Idle state - Call to action
    if (compact) {
        return (
            <button
                onClick={requestLocation}
                className="w-full px-3 py-2 bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all flex items-center gap-2"
            >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Bật định vị để tìm gần bạn</span>
                <Navigation className="w-4 h-4 text-blue-400 ml-auto" />
            </button>
        );
    }

    return (
        <button
            onClick={requestLocation}
            className="w-full p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 rounded-xl transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left flex-1">
                    <p className="text-white font-medium">📍 Bật Định Vị</p>
                    <p className="text-[#9B9A97] text-sm">
                        Tìm người dùng gần bạn, xem khoảng cách
                    </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                </div>
            </div>
        </button>
    );
}
