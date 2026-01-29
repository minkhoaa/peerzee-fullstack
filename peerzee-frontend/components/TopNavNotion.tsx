'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronDown, User, Settings, LogOut, Sparkles, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPopover from './NotificationPopover';

/**
 * TopNavNotion - Cute Retro OS styled top navigation
 * "HUD Bar" - Game status display
 * Design: Polka dot pattern, thick borders, pixel buttons
 */
export default function TopNavNotion() {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-retro-paper border-b-4 border-cocoa z-50 px-4 shadow-[0_4px_0_0_#8D6E63]">
            <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between gap-4">
                {/* Logo - Game Title */}
                <Link href="/community" className="flex items-center gap-2 shrink-0 group">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-10 h-10 bg-pixel-pink border-3 border-cocoa rounded-lg flex items-center justify-center shadow-[2px_2px_0_0_#5A3E36]">
                            <Gamepad2 className="w-6 h-6 text-cocoa" />
                        </div>
                        <span className="font-pixel text-xl text-cocoa uppercase tracking-wide">Peerzee</span>
                    </motion.div>
                </Link>

                {/* Search - Quest Finder */}
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-light" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search players..."
                            className="w-full h-10 bg-white border-3 border-cocoa rounded-xl pl-11 pr-4 font-body text-sm text-cocoa placeholder-cocoa-light outline-none transition-all shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.1)] focus:ring-2 focus:ring-pixel-pink focus:border-pixel-pink-dark"
                        />
                    </div>
                </div>

                {/* Actions - Quick Menu */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="/community">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-pixel-pink border-3 border-cocoa text-cocoa rounded-xl font-pixel text-sm uppercase shadow-[3px_3px_0_0_#5A3E36] hover:shadow-[1px_1px_0_0_#5A3E36] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>New</span>
                        </motion.div>
                    </Link>

                    <NotificationPopover />

                    {/* User Menu - Player Profile */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-1.5 bg-white border-3 border-cocoa rounded-xl shadow-[2px_2px_0_0_#5A3E36] hover:bg-pixel-blue/30 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-pixel-green border-2 border-cocoa flex items-center justify-center text-cocoa font-pixel text-sm">
                                U
                            </div>
                            <ChevronDown className="w-4 h-4 text-cocoa mr-1" />
                        </motion.button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-14 w-56 bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] z-20 py-2 overflow-hidden"
                                    >
                                        {/* Window Title Bar */}
                                        <div className="bg-pixel-blue border-b-3 border-cocoa px-3 py-2 mb-2 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-pixel-red border border-cocoa" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-pixel-yellow border border-cocoa" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-pixel-green border border-cocoa" />
                                            <span className="font-pixel text-xs text-cocoa ml-2 uppercase">Menu</span>
                                        </div>

                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-4 py-2.5 text-cocoa hover:bg-pixel-pink/30 font-body text-sm transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-pixel-pink/50 border-2 border-cocoa flex items-center justify-center">
                                                <User className="w-4 h-4 text-cocoa" />
                                            </div>
                                            Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-3 px-4 py-2.5 text-cocoa hover:bg-pixel-blue/30 font-body text-sm transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-pixel-blue/50 border-2 border-cocoa flex items-center justify-center">
                                                <Settings className="w-4 h-4 text-cocoa" />
                                            </div>
                                            Settings
                                        </Link>
                                        <hr className="my-2 border-cocoa border-dashed mx-3" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-pixel-red hover:bg-pixel-red/10 font-body text-sm transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-pixel-red/20 border-2 border-cocoa flex items-center justify-center">
                                                <LogOut className="w-4 h-4 text-pixel-red" />
                                            </div>
                                            Log out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
