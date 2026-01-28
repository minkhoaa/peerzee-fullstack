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
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-[20px] border-l-4 border-[#CD6E67] shadow-sm">
                <CheckCircle className="w-5 h-5 text-[#CD6E67]" />
                <span className="text-[#3E3229] text-sm font-bold">Đã bật định vị</span>
                <button
                    onClick={requestLocation}
                    className="ml-auto text-xs text-[#CD6E67] hover:text-[#B55B55] flex items-center gap-1 font-extrabold uppercase tracking-wide hover:underline"
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
            <div className="p-4 bg-[#FDF0F1] rounded-[20px] border-l-4 border-red-400 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-[#3E3229] font-bold">{errorMessage}</span>
                </div>
                <button
                    onClick={requestLocation}
                    className="w-full py-2 bg-white hover:bg-red-50 text-red-500 text-sm font-bold rounded-full transition-colors shadow-sm"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    // Requesting state
    if (status === 'requesting') {
        return (
            <div className="p-4 bg-[#FDF0F1] rounded-[20px] border-l-4 border-[#CD6E67] shadow-sm">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#CD6E67] animate-spin" />
                    <span className="text-[#3E3229] font-bold">Đang xác định vị trí...</span>
                </div>
            </div>
        );
    }

    // Idle state - Call to action
    if (compact) {
        return (
            <button
                onClick={requestLocation}
                className="w-full px-4 py-4 bg-[#FDF0F1] rounded-[20px] border-l-8 border-[#CD6E67] shadow-sm hover:shadow-md transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#CD6E67]" />
                    <span className="text-[#3E3229] text-sm font-bold">Bật định vị để tìm gần bạn</span>
                </div>
                <span className="text-[#CD6E67] font-extrabold uppercase tracking-wide hover:underline text-xs">BẬT</span>
            </button>
        );
    }

    return (
        <button
            onClick={requestLocation}
            className="w-full p-5 bg-[#FDF0F1] rounded-[30px] shadow-lg shadow-[#CD6E67]/10 hover:shadow-xl hover:shadow-[#CD6E67]/15 transition-all group border-l-8 border-[#CD6E67]"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#CD6E67] flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="text-left flex-1">
                    <p className="text-[#3E3229] font-black text-lg">📍 Bật Định Vị</p>
                    <p className="text-[#7A6862] text-sm font-semibold">
                        Tìm người dùng gần bạn, xem khoảng cách
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#CD6E67] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <Navigation className="w-5 h-5 text-white" />
                </div>
            </div>
        </button>
    );
}
