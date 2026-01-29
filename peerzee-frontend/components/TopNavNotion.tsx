'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import NotificationPopover from './NotificationPopover';

export default function TopNavNotion() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-retro-white border-b-3 border-cocoa shadow-pixel z-50 px-4">
            <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/community" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-cocoa border-2 border-cocoa flex items-center justify-center shadow-pixel-sm">
                        <span className="text-retro-white font-pixel text-sm">P</span>
                    </div>
                    <span className="text-cocoa font-pixel text-base uppercase tracking-widest">Peerzee</span>
                </Link>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-light" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full h-9 bg-retro-white border-2 border-cocoa rounded-lg pl-9 pr-3 text-sm text-cocoa font-bold placeholder-cocoa-light outline-none shadow-pixel-inset focus:ring-2 focus:ring-pixel-pink transition-colors"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/community"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-cocoa hover:bg-pixel-blue border-2 border-transparent hover:border-cocoa rounded-lg transition-colors text-sm font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New</span>
                    </Link>

                    <NotificationPopover />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-1.5 p-1.5 hover:bg-pixel-purple/30 border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                        >
                            <div className="w-7 h-7 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa text-xs font-pixel">
                                U
                            </div>
                            <ChevronDown className="w-3 h-3 text-cocoa" />
                        </button>

                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                <div className="absolute right-0 top-12 w-48 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel z-20 py-1 overflow-hidden">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-3 py-2 text-cocoa hover:bg-pixel-blue/30 text-sm font-bold transition-colors"
                                    >
                                        <User className="w-4 h-4 text-cocoa-light" />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 px-3 py-2 text-cocoa hover:bg-pixel-blue/30 text-sm font-bold transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-cocoa-light" />
                                        Settings
                                    </Link>
                                    <hr className="my-1 border-cocoa" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-pixel-red hover:bg-pixel-red/10 text-sm font-bold transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
