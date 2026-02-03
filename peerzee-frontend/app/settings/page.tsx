'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Volume2, Shield, User, Wrench, Trash2, Key } from 'lucide-react';
import { clsx } from 'clsx';
import { GlobalHeader } from '@/components/layout';
import { PixelToggle, VolumeSlider, RetroSelect, RetroInput } from '@/components/ui/retro-form';
import RetroButton from '@/components/retro/RetroButton';

// ============================================
// TYPES
// ============================================
type TabId = 'audio' | 'privacy' | 'account' | 'general';

interface SettingsState {
    // Audio & Immersion
    masterVolume: number;
    sfxVolume: number;
    backgroundMusic: boolean;
    retroFilters: boolean;

    // Privacy & Safety
    ghostMode: boolean;
    directMessages: 'everyone' | 'matches';
    strictFilter: boolean;

    // Account
    displayName: string;
    email: string;
}

const DEFAULT_SETTINGS: SettingsState = {
    masterVolume: 75,
    sfxVolume: 50,
    backgroundMusic: true,
    retroFilters: false,
    ghostMode: false,
    directMessages: 'everyone',
    strictFilter: true,
    displayName: 'Adventurer',
    email: 'user@example.com',
};

// ============================================
// TAB CONFIGURATION
// ============================================
const TABS = [
    { id: 'audio' as TabId, label: 'Audio', icon: Volume2 },
    { id: 'privacy' as TabId, label: 'Privacy', icon: Shield },
    { id: 'account' as TabId, label: 'Account', icon: User },
    { id: 'general' as TabId, label: 'General', icon: Wrench },
];

// ============================================
// MAIN SETTINGS PAGE
// ============================================
export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('audio');
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [savedSettings, setSavedSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(parsed);
                setSavedSettings(parsed);
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }, []);

    // Apply CRT effect globally
    useEffect(() => {
        const body = document.body;
        if (settings.retroFilters) {
            body.classList.add('scanlines');
        } else {
            body.classList.remove('scanlines');
        }
        return () => body.classList.remove('scanlines');
    }, [settings.retroFilters]);

    // Check if settings have changed
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

    // Update a setting
    const updateSetting = <K extends keyof SettingsState>(
        key: K,
        value: SettingsState[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    // Save settings
    const handleSave = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        setSavedSettings(settings);
    };

    // Reset to defaults
    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <div className="min-h-screen bg-retro-bg pt-16 relative">
            {/* Global Header */}
            <GlobalHeader
                title="SYSTEM CONFIG"
                subtitle="The Workshop • Settings"
            />

            {/* Main Container */}
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                {/* Wooden Board Container */}
                <div
                    className="border-8 rounded-xl overflow-hidden shadow-[6px_6px_0_#62544B]"
                    style={{
                        backgroundColor: '#8D6E63',
                        borderColor: '#5C4033',
                    }}
                >
                    {/* Inner Panel */}
                    <div className="bg-[#2C2C2C] p-1">
                        <div className="bg-retro-paper min-h-[600px]">
                            {/* Header */}
                            <div className="bg-wood-dark border-b-4 border-wood-shadow p-4">
                                <h1 className="font-pixel text-2xl md:text-3xl text-parchment text-center uppercase tracking-wider">
                                    ⚙️ OPTIONS MENU ⚙️
                                </h1>
                            </div>

                            {/* Content Layout */}
                            <div className="flex flex-col md:flex-row">
                                {/* Sidebar Tabs - Desktop */}
                                <aside className="hidden md:block w-48 bg-wood-medium border-r-4 border-wood-shadow p-4 space-y-2">
                                    {TABS.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={clsx(
                                                    'w-full flex items-center gap-3 px-4 py-3',
                                                    'font-pixel text-sm uppercase tracking-wider',
                                                    'border-3 border-wood-shadow rounded-lg',
                                                    'transition-all duration-150',
                                                    'shadow-[2px_2px_0_0_#2A1F17]',
                                                    'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
                                                    activeTab === tab.id
                                                        ? 'bg-pixel-pink text-cocoa'
                                                        : 'bg-wood-light text-parchment hover:bg-pixel-yellow'
                                                )}
                                            >
                                                <Icon className="w-4 h-4" strokeWidth={2.5} />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </aside>

                                {/* Mobile Tab Selector */}
                                <div className="md:hidden p-4 bg-wood-medium border-b-4 border-wood-shadow">
                                    <RetroSelect
                                        label="Section"
                                        value={activeTab}
                                        onChange={(value) => setActiveTab(value as TabId)}
                                        options={TABS.map((tab) => ({
                                            value: tab.id,
                                            label: tab.label,
                                        }))}
                                    />
                                </div>

                                {/* Content Area */}
                                <main className="flex-1 p-6 md:p-8 space-y-6">
                                    {/* Audio & Immersion Tab */}
                                    {activeTab === 'audio' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Volume2 className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                                                <h2 className="font-pixel text-xl text-cocoa uppercase">
                                                    Audio & Immersion
                                                </h2>
                                            </div>

                                            <div className="space-y-5">
                                                <VolumeSlider
                                                    id="master-volume"
                                                    label="Master Volume"
                                                    value={settings.masterVolume}
                                                    onChange={(v) => updateSetting('masterVolume', v)}
                                                />

                                                <VolumeSlider
                                                    id="sfx-volume"
                                                    label="SFX Volume"
                                                    value={settings.sfxVolume}
                                                    onChange={(v) => updateSetting('sfxVolume', v)}
                                                />

                                                <PixelToggle
                                                    id="background-music"
                                                    label="Tavern Ambience"
                                                    description="Play background music while browsing"
                                                    checked={settings.backgroundMusic}
                                                    onChange={(v) => updateSetting('backgroundMusic', v)}
                                                />

                                                <PixelToggle
                                                    id="retro-filters"
                                                    label="Retro Filters"
                                                    description="Enable CRT scanline effect across the app"
                                                    checked={settings.retroFilters}
                                                    onChange={(v) => updateSetting('retroFilters', v)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Privacy & Safety Tab */}
                                    {activeTab === 'privacy' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Shield className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                                                <h2 className="font-pixel text-xl text-cocoa uppercase">
                                                    Privacy & Safety
                                                </h2>
                                            </div>

                                            <div className="space-y-5">
                                                <PixelToggle
                                                    id="ghost-mode"
                                                    label="Ghost Mode"
                                                    description="Hide your profile from the Match queue while you explore"
                                                    checked={settings.ghostMode}
                                                    onChange={(v) => updateSetting('ghostMode', v)}
                                                />

                                                <RetroSelect
                                                    id="direct-messages"
                                                    label="Direct Messages"
                                                    value={settings.directMessages}
                                                    onChange={(v) => updateSetting('directMessages', v as 'everyone' | 'matches')}
                                                    options={[
                                                        { value: 'everyone', label: 'Everyone' },
                                                        { value: 'matches', label: 'Matches Only' },
                                                    ]}
                                                />

                                                <PixelToggle
                                                    id="strict-filter"
                                                    label="Strict Filter"
                                                    description="AI filters out bad words automatically"
                                                    checked={settings.strictFilter}
                                                    onChange={(v) => updateSetting('strictFilter', v)}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Account Tab */}
                                    {activeTab === 'account' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <User className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                                                <h2 className="font-pixel text-xl text-cocoa uppercase">
                                                    Account
                                                </h2>
                                            </div>

                                            <div className="space-y-5">
                                                <RetroInput
                                                    id="display-name"
                                                    label="Display Name"
                                                    value={settings.displayName}
                                                    onChange={(e) => updateSetting('displayName', e.target.value)}
                                                    placeholder="Enter your name..."
                                                />

                                                <RetroInput
                                                    id="email"
                                                    label="Email Address"
                                                    value={settings.email}
                                                    readOnly
                                                />

                                                <div className="pt-2">
                                                    <RetroButton
                                                        variant="secondary"
                                                        size="md"
                                                        onClick={() => setShowPasswordModal(true)}
                                                        icon={<Key className="w-4 h-4" />}
                                                    >
                                                        Update Password
                                                    </RetroButton>
                                                </div>

                                                {/* Danger Zone */}
                                                <div className="mt-8 pt-6 border-t-3 border-pixel-red/30">
                                                    <h3 className="font-pixel text-lg text-pixel-red mb-3 flex items-center gap-2">
                                                        ☠️ DANGER ZONE
                                                    </h3>
                                                    <p className="text-sm text-cocoa-light font-body mb-4">
                                                        Once you delete your account, there is no going back. Please be certain.
                                                    </p>
                                                    <RetroButton
                                                        variant="primary"
                                                        size="md"
                                                        onClick={() => setShowDeleteModal(true)}
                                                        icon={<Trash2 className="w-4 h-4" />}
                                                        className="!bg-pixel-red !text-white hover:!bg-pixel-red/80"
                                                    >
                                                        Burn Identity
                                                    </RetroButton>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* General Tab */}
                                    {activeTab === 'general' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Wrench className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                                                <h2 className="font-pixel text-xl text-cocoa uppercase">
                                                    General
                                                </h2>
                                            </div>

                                            <div className="text-center py-12">
                                                <p className="font-pixel text-2xl text-cocoa-light">
                                                    Coming Soon...
                                                </p>
                                                <p className="font-body text-sm text-cocoa-light mt-2">
                                                    More settings will be added here
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </main>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Save Button */}
            {hasChanges && (
                <button
                    onClick={handleSave}
                    className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 bg-pixel-pink text-cocoa font-pixel text-lg uppercase tracking-wider border-3 border-cocoa rounded-lg shadow-[4px_4px_0_#62544B] hover:shadow-[6px_6px_0_#62544B] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 animate-pulse-glow z-50"
                >
                    <Save className="w-5 h-5" strokeWidth={2.5} />
                    SAVE CHANGES
                </button>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-cocoa/60 backdrop-blur-sm"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    <div className="relative bg-retro-white border-3 border-cocoa rounded-xl p-6 max-w-md w-full shadow-pixel">
                        <h3 className="text-xl font-pixel uppercase tracking-wider text-pixel-red mb-4">
                            ⚠️ Confirm Deletion
                        </h3>
                        <p className="font-body text-sm text-cocoa mb-6">
                            This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <RetroButton
                                variant="secondary"
                                size="md"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </RetroButton>
                            <RetroButton
                                variant="primary"
                                size="md"
                                onClick={() => {
                                    // Handle deletion
                                    console.log('Account deleted');
                                    setShowDeleteModal(false);
                                }}
                                className="flex-1 !bg-pixel-red !text-white hover:!bg-pixel-red/80"
                            >
                                Delete Forever
                            </RetroButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Update Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-cocoa/60 backdrop-blur-sm"
                        onClick={() => setShowPasswordModal(false)}
                    />
                    <div className="relative bg-retro-white border-3 border-cocoa rounded-xl p-6 max-w-md w-full shadow-pixel">
                        <h3 className="text-xl font-pixel uppercase tracking-wider text-cocoa mb-4">
                            🔑 Update Password
                        </h3>
                        <div className="space-y-4 mb-6">
                            <RetroInput
                                id="current-password"
                                label="Current Password"
                                type="password"
                                placeholder="Enter current password..."
                            />
                            <RetroInput
                                id="new-password"
                                label="New Password"
                                type="password"
                                placeholder="Enter new password..."
                            />
                            <RetroInput
                                id="confirm-password"
                                label="Confirm Password"
                                type="password"
                                placeholder="Confirm new password..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <RetroButton
                                variant="secondary"
                                size="md"
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </RetroButton>
                            <RetroButton
                                variant="primary"
                                size="md"
                                onClick={() => {
                                    // Handle password update
                                    console.log('Password updated');
                                    setShowPasswordModal(false)
                                }
                                }
                                className="flex-1"
                            >
                                Update
                            </RetroButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
