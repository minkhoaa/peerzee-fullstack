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
        <header className="fixed top-0 left-0 right-0 h-12 bg-[#191919]/80 backdrop-blur-md border-b border-[#2F2F2F] z-50 px-4">
            <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/community" className="flex items-center gap-2 shrink-0">
                    <span className="text-[#E3E3E3] font-semibold text-base">Peerzee</span>
                </Link>

                {/* Search */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9A97]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full h-8 bg-[#202020] hover:bg-[#252525] focus:bg-[#252525] border border-[#2F2F2F] rounded-md pl-9 pr-3 text-sm text-[#E3E3E3] placeholder-[#9B9A97] outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <Link
                        href="/community"
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-md transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New</span>
                    </Link>

                    <NotificationPopover />

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-1.5 p-1.5 hover:bg-[#2F2F2F] rounded-md transition-colors"
                        >
                            <div className="w-6 h-6 rounded-md bg-[#37352F] flex items-center justify-center text-[#E3E3E3] text-xs">
                                U
                            </div>
                            <ChevronDown className="w-3 h-3 text-[#9B9A97]" />
                        </button>

                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                <div className="absolute right-0 top-10 w-48 bg-[#252525] border border-[#2F2F2F] rounded-md shadow-lg z-20 py-1">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 px-3 py-2 text-[#E3E3E3] hover:bg-[#2F2F2F] text-sm transition-colors"
                                    >
                                        <User className="w-4 h-4 text-[#9B9A97]" />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 px-3 py-2 text-[#E3E3E3] hover:bg-[#2F2F2F] text-sm transition-colors"
                                    >
                                        <Settings className="w-4 h-4 text-[#9B9A97]" />
                                        Settings
                                    </Link>
                                    <hr className="my-1 border-[#2F2F2F]" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-[#E3E3E3] hover:bg-[#2F2F2F] text-sm transition-colors"
                                    >
                                        <LogOut className="w-4 h-4 text-[#9B9A97]" />
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
