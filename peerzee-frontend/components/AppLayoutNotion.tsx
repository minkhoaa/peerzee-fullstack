'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { VillageHeader, WoodenFrame, PixelButton } from './village';
import { Home, Search, Heart, MessageSquare, User, Users, Gamepad2, Trophy, Bell, Settings } from 'lucide-react';

interface AppLayoutNotionProps {
    children: React.ReactNode;
}

/**
 * AppLayoutNotion - Peerzee Village styled 3-column layout
 * Medieval village bulletin board aesthetic
 */
export default function AppLayoutNotion({ children }: AppLayoutNotionProps) {
    const router = useRouter();
    
    const navItems = [
        { icon: Home, label: 'HOME', href: '/' },
        { icon: Search, label: 'DISCOVER', href: '/discover' },
        { icon: Heart, label: 'LIKES', href: '/likers' },
        { icon: MessageSquare, label: 'CHAT', href: '/chat' },
        { icon: Gamepad2, label: 'ARCADE', href: '/match' },
        { icon: User, label: 'PROFILE', href: '/profile' },
    ];

    return (
        <div className="min-h-screen grass-dots flex flex-col">
            <VillageHeader
                title="PEERZEE VILLAGE"
                subtitle="COMMUNITY BOARD"
            />

            <div className="flex-1 flex">
                {/* Left Sidebar */}
                <aside className="hidden lg:block w-64 p-4">
                    <WoodenFrame>
                        <div className="p-4">
                            <h3 className="font-pixel text-lg text-wood-dark mb-4">NAVIGATION</h3>
                            <nav className="space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.label}
                                        onClick={() => router.push(item.href)}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-wood-dark hover:bg-cork/30 border-2 border-transparent hover:border-wood-dark transition-all"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-pixel text-sm">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                            
                            <div className="mt-6 pt-4 border-t-2 border-wood-dark/30">
                                <h4 className="font-pixel text-sm text-wood-dark/70 mb-3">QUICK ACTIONS</h4>
                                <PixelButton 
                                    variant="primary" 
                                    size="sm" 
                                    className="w-full mb-2"
                                    onClick={() => router.push('/discover')}
                                >
                                    FIND FRIENDS
                                </PixelButton>
                            </div>
                        </div>
                    </WoodenFrame>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
                    {children}
                </main>

                {/* Right Sidebar */}
                <aside className="hidden xl:block w-72 p-4">
                    <WoodenFrame>
                        <div className="p-4">
                            <h3 className="font-pixel text-lg text-wood-dark mb-4">TOWN CRIER</h3>
                            <p className="text-xs text-wood-dark/70 mb-3 uppercase tracking-wide">EXTRA! EXTRA!</p>
                            
                            <div className="space-y-3">
                                <div className="bg-parchment border-2 border-wood-dark p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">📣</span>
                                        <span className="font-pixel text-xs text-wood-dark">TRENDING</span>
                                    </div>
                                    <div className="space-y-1">
                                        <button className="text-xs text-primary-orange hover:underline block">#WeekendVibes <span className="text-wood-dark/50">1.2k</span></button>
                                        <button className="text-xs text-primary-orange hover:underline block">#CoffeeLovers <span className="text-wood-dark/50">856</span></button>
                                        <button className="text-xs text-primary-orange hover:underline block">#StudyBuddies <span className="text-wood-dark/50">420</span></button>
                                    </div>
                                </div>
                                
                                <div className="bg-parchment border-2 border-wood-dark p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-wood-dark" />
                                        <span className="font-pixel text-xs text-wood-dark">NEW VILLAGERS</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="w-10 h-10 bg-accent-blue border-2 border-wood-dark" />
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-parchment border-2 border-wood-dark p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="w-4 h-4 text-accent-yellow" />
                                        <span className="font-pixel text-xs text-wood-dark">TOP POSTERS</span>
                                    </div>
                                    <div className="space-y-2">
                                        {['PixelMaster', 'VillageHero', 'CozyGamer'].map((name, i) => (
                                            <div key={name} className="flex items-center gap-2 text-xs text-wood-dark">
                                                <span className="font-pixel text-primary-orange">{i + 1}.</span>
                                                <span>{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </WoodenFrame>
                </aside>
            </div>
        </div>
    );
}
