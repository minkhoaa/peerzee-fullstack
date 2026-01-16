'use client';

import React from 'react';
import TopNavNotion from './TopNavNotion';
import LeftSidebarNotion from './LeftSidebarNotion';
import RightSidebarNotion from './RightSidebarNotion';

interface AppLayoutNotionProps {
    children: React.ReactNode;
}

export default function AppLayoutNotion({ children }: AppLayoutNotionProps) {
    return (
        <div className="min-h-screen bg-[#191919] overflow-x-hidden">
            {/* Top Navigation */}
            <TopNavNotion />

            {/* Main Container */}
            <div className="pt-12">
                <div className="max-w-[1200px] mx-auto flex">
                    {/* Left Sidebar - Border separated */}
                    <div className="hidden lg:block w-52 shrink-0 border-r border-[#2F2F2F] sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
                        <LeftSidebarNotion />
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0 px-6 py-4">
                        {children}
                    </main>

                    {/* Right Sidebar - Border separated */}
                    <div className="hidden xl:block w-56 shrink-0 border-l border-[#2F2F2F] sticky top-12 h-[calc(100vh-48px)] overflow-y-auto">
                        <RightSidebarNotion />
                    </div>
                </div>
            </div>
        </div>
    );
}
