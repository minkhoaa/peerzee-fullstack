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
        <div className="min-h-screen bg-retro-bg overflow-x-hidden font-body">
            {/* Top Navigation */}
            <TopNavNotion />

            {/* Main Container */}
            <div className="pt-20 px-4 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-5">
                        {/* Left Sidebar - Navigation */}
                        <div className="hidden lg:block col-span-3">
                            <LeftSidebarNotion />
                        </div>

                        {/* Main Content - Feed */}
                        <main className="col-span-12 lg:col-span-6 flex flex-col gap-5">
                            {children}
                        </main>

                        {/* Right Sidebar - Trending */}
                        <div className="hidden xl:block col-span-3">
                            <RightSidebarNotion />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
