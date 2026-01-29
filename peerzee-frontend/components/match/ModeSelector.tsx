"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, MessageSquare, X, Users, Heart, BookOpen, UserPlus, Play, Home, Search, MessageCircle, User } from "lucide-react";
import { GlobalHeader } from "@/components/layout";

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

interface ModeSelectorProps {
  onStart: (mode: "text" | "video", interests: string[], intentMode: IntentMode, genderPref: GenderPref) => void;
  queueSize: number;
  error: string | null;
}

// ============================================
// VILLAGE THEME COLORS (STRICT)
// ============================================
const COLORS = {
  woodDark: '#4A3B32',
  woodShadow: '#261E1A',
  woodMedium: '#6B5344',
  woodLight: '#8B7355',
  cork: '#E0C097',
  corkDark: '#AC7F55',
  primary: '#EC4913',
  primaryDark: '#B0320A',
  parchment: '#FDF5E6',
  accent: '#D4A373',
  accentPink: '#E91E63',
  accentBlue: '#2196F3',
  landscapeGreen: '#4CAF50',
} as const;

// ============================================
// NAV ITEMS FOR TOP NAVIGATION
// ============================================
const NAV_ITEMS = [
  { icon: Home, label: 'HOME', href: '/' },
  { icon: Search, label: 'DISCOVER', href: '/discover' },
  { icon: MessageCircle, label: 'CHAT', href: '/chat' },
  { icon: User, label: 'PROFILE', href: '/profile' },
];

export function ModeSelector({ onStart, queueSize, error }: ModeSelectorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"text" | "video" | null>(null);
  const [intentMode, setIntentMode] = useState<IntentMode>('DATE');
  const [genderPref, setGenderPref] = useState<GenderPref>('all');
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const suggestedInterests = [
    "Music", "Programming", "Movies", "Gaming", "Art", "Travel",
    "Photography", "Food", "Books", "Sports", "Anime", "Fashion"
  ];

  const intentModes = [
    { value: 'DATE' as IntentMode, label: 'DATE', icon: Heart, bgColor: COLORS.accentPink },
    { value: 'STUDY' as IntentMode, label: 'STUDY', icon: BookOpen, bgColor: COLORS.accentBlue },
    { value: 'FRIEND' as IntentMode, label: 'FRIEND', icon: UserPlus, bgColor: COLORS.landscapeGreen },
  ];

  const genderOptions = [
    { value: 'all' as GenderPref, label: 'Everyone' },
    { value: 'male' as GenderPref, label: 'Male' },
    { value: 'female' as GenderPref, label: 'Female' },
  ];

  const handleAddInterest = (interest: string) => {
    if (interest && !interests.includes(interest) && interests.length < 5) {
      setInterests([...interests, interest]);
      setInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleStart = () => {
    if (selectedMode) {
      onStart(selectedMode, interests, intentMode, genderPref);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: '#7CB342' }}>
      {/* Grass Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, ${COLORS.woodShadow} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Top Navigation Bar */}
      <nav 
        className="w-full shrink-0 flex items-center justify-center gap-1 px-2 py-2 relative z-10"
        style={{ 
          backgroundColor: COLORS.woodMedium, 
          borderBottom: `3px solid ${COLORS.woodShadow}` 
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 font-pixel text-xs transition-all hover:opacity-80 border-2"
                style={{ 
                  backgroundColor: COLORS.woodLight, 
                  borderColor: COLORS.woodShadow,
                  color: COLORS.parchment,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Global Header */}
      <GlobalHeader
        title="ARCADE"
        subtitle="Multiplayer Lobby • Find a Match"
        showNotifications={false}
      />

      {/* Main Stage (Flex Center) */}
      <main className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden relative z-10">
        
        {/* The Arcade Cabinet */}
        <div 
          className="w-full max-w-3xl max-h-full flex flex-col relative animate-pop"
          style={{
            backgroundColor: COLORS.woodDark,
            border: `4px solid ${COLORS.woodShadow}`,
            boxShadow: '0 8px 0 rgba(0,0,0,0.3), 0 12px 20px rgba(0,0,0,0.4)',
            borderRadius: '4px',
          }}
        >
          {/* DECORATION: Screw heads in corners */}
          <span className="absolute -top-2 -left-2 text-lg opacity-50" style={{ color: COLORS.woodLight }}>⊕</span>
          <span className="absolute -top-2 -right-2 text-lg opacity-50" style={{ color: COLORS.woodLight }}>⊕</span>
          <span className="absolute -bottom-2 -left-2 text-lg opacity-50" style={{ color: COLORS.woodLight }}>⊕</span>
          <span className="absolute -bottom-2 -right-2 text-lg opacity-50" style={{ color: COLORS.woodLight }}>⊕</span>

          {/* Cabinet Header */}
          <div 
            className="p-3 flex justify-between items-center shrink-0"
            style={{ 
              backgroundColor: COLORS.woodMedium, 
              borderBottom: `4px solid ${COLORS.woodShadow}` 
            }}
          >
            <h2 
              className="font-pixel text-xl md:text-2xl uppercase tracking-widest"
              style={{ 
                color: COLORS.parchment, 
                textShadow: '2px 2px 0 rgba(0,0,0,0.3)' 
              }}
            >
              👾 MATCHMAKING SYSTEM
            </h2>
            {/* Exit Button */}
            <Link href="/community">
              <button 
                className="font-pixel text-sm px-3 py-1.5 transition-all active:translate-y-1 hover:brightness-110"
                style={{
                  backgroundColor: COLORS.primaryDark,
                  color: 'white',
                  borderBottom: `4px solid #5a1a05`,
                  borderRadius: '2px',
                }}
              >
                EXIT LOBBY
              </button>
            </Link>
          </div>

          {/* Cabinet Screen (Scrollable Content) */}
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar min-h-0"
            style={{ backgroundColor: COLORS.parchment }}
          >
            {/* Intent Mode Selection */}
            <div className="mb-5">
              <label className="font-pixel text-sm mb-2 block" style={{ color: COLORS.woodDark }}>
                LOOKING FOR
              </label>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {intentModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = intentMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setIntentMode(mode.value)}
                      className="p-3 md:p-4 transition-all flex flex-col items-center gap-2"
                      style={{
                        backgroundColor: isActive ? 'white' : COLORS.parchment,
                        border: `4px solid ${isActive ? COLORS.primary : COLORS.woodLight}`,
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isActive ? `0 0 0 4px ${COLORS.primary}33, 0 4px 0 ${COLORS.woodShadow}` : `0 4px 0 ${COLORS.woodShadow}`,
                        opacity: isActive ? 1 : 0.7,
                        filter: isActive ? 'none' : 'grayscale(30%)',
                      }}
                    >
                      <div 
                        className="w-10 h-10 flex items-center justify-center border-2"
                        style={{ 
                          backgroundColor: mode.bgColor, 
                          borderColor: COLORS.woodShadow 
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: COLORS.parchment }} />
                      </div>
                      <span className="font-pixel text-xs" style={{ color: COLORS.woodDark }}>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Preference */}
            <div className="mb-5">
              <label className="font-pixel text-sm mb-2 block" style={{ color: COLORS.woodDark }}>
                MATCH WITH
              </label>
              <div className="flex gap-2">
                {genderOptions.map((opt) => {
                  const isActive = genderPref === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setGenderPref(opt.value)}
                      className="flex-1 py-2 px-3 font-pixel text-xs transition-all border-2"
                      style={{
                        backgroundColor: isActive ? COLORS.primary : COLORS.parchment,
                        color: isActive ? COLORS.parchment : COLORS.woodDark,
                        borderColor: isActive ? COLORS.woodShadow : `${COLORS.woodDark}80`,
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5">
              {/* Text Mode */}
              <button
                onClick={() => setSelectedMode("text")}
                className="relative transition-all"
                style={{
                  transform: selectedMode === "text" ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div 
                  className="p-4 md:p-6 transition-all"
                  style={{
                    backgroundColor: selectedMode === "text" ? 'white' : COLORS.parchment,
                    border: `4px solid ${selectedMode === "text" ? COLORS.primary : COLORS.woodLight}`,
                    boxShadow: selectedMode === "text" 
                      ? `0 0 0 4px ${COLORS.primary}33, 0 4px 0 ${COLORS.woodShadow}` 
                      : `0 4px 0 ${COLORS.woodShadow}`,
                    opacity: selectedMode === "text" ? 1 : 0.7,
                    filter: selectedMode === "text" ? 'none' : 'grayscale(30%)',
                  }}
                >
                  <div 
                    className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 flex items-center justify-center border-3"
                    style={{ 
                      backgroundColor: COLORS.landscapeGreen, 
                      borderColor: COLORS.woodShadow 
                    }}
                  >
                    <MessageSquare className="w-7 h-7 md:w-8 md:h-8" style={{ color: COLORS.parchment }} />
                  </div>
                  <h3 className="font-pixel text-base md:text-lg mb-1" style={{ color: COLORS.woodDark }}>TEXT MODE</h3>
                  <p className="text-xs" style={{ color: `${COLORS.woodDark}AA` }}>Chat anonymously!</p>
                </div>
                {selectedMode === "text" && (
                  <div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2"
                    style={{ 
                      backgroundColor: COLORS.primary, 
                      borderColor: COLORS.woodShadow 
                    }}
                  >
                    <span className="font-pixel text-sm" style={{ color: COLORS.parchment }}>✓</span>
                  </div>
                )}
              </button>

              {/* Video Mode */}
              <button
                onClick={() => setSelectedMode("video")}
                className="relative transition-all"
                style={{
                  transform: selectedMode === "video" ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div 
                  className="p-4 md:p-6 transition-all"
                  style={{
                    backgroundColor: selectedMode === "video" ? 'white' : COLORS.parchment,
                    border: `4px solid ${selectedMode === "video" ? COLORS.primary : COLORS.woodLight}`,
                    boxShadow: selectedMode === "video" 
                      ? `0 0 0 4px ${COLORS.primary}33, 0 4px 0 ${COLORS.woodShadow}` 
                      : `0 4px 0 ${COLORS.woodShadow}`,
                    opacity: selectedMode === "video" ? 1 : 0.7,
                    filter: selectedMode === "video" ? 'none' : 'grayscale(30%)',
                  }}
                >
                  <div 
                    className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 flex items-center justify-center border-3"
                    style={{ 
                      backgroundColor: COLORS.accentBlue, 
                      borderColor: COLORS.woodShadow 
                    }}
                  >
                    <Video className="w-7 h-7 md:w-8 md:h-8" style={{ color: COLORS.parchment }} />
                  </div>
                  <h3 className="font-pixel text-base md:text-lg mb-1" style={{ color: COLORS.woodDark }}>VIDEO MODE</h3>
                  <p className="text-xs" style={{ color: `${COLORS.woodDark}AA` }}>Face-to-face!</p>
                </div>
                {selectedMode === "video" && (
                  <div 
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2"
                    style={{ 
                      backgroundColor: COLORS.primary, 
                      borderColor: COLORS.woodShadow 
                    }}
                  >
                    <span className="font-pixel text-sm" style={{ color: COLORS.parchment }}>✓</span>
                  </div>
                )}
              </button>
            </div>

            {/* Interests Input */}
            <div className="mb-5">
              <label className="font-pixel text-sm mb-2 block" style={{ color: COLORS.woodDark }}>
                TALK ABOUT (OPTIONAL)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInterest(interestInput);
                    }
                  }}
                  placeholder="Type an interest..."
                  maxLength={20}
                  className="flex-1 px-3 py-2 font-pixel text-sm border-3 outline-none"
                  style={{ 
                    backgroundColor: 'white',
                    borderColor: COLORS.woodShadow,
                    color: COLORS.woodDark,
                  }}
                />
                <button
                  onClick={() => handleAddInterest(interestInput)}
                  disabled={!interestInput || interests.length >= 5}
                  className="px-3 py-2 font-pixel text-sm border-2 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.woodShadow,
                    color: COLORS.parchment,
                  }}
                >
                  ADD
                </button>
              </div>

              {/* Selected Interests */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 font-pixel text-xs flex items-center gap-1 border-2"
                      style={{
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.woodShadow,
                        color: COLORS.parchment,
                      }}
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="hover:opacity-70 rounded-full p-0.5 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Interests */}
              <div className="flex flex-wrap gap-2">
                {suggestedInterests
                  .filter((s) => !interests.includes(s))
                  .slice(0, 6)
                  .map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleAddInterest(interest)}
                      disabled={interests.length >= 5}
                      className="px-2.5 py-1 font-pixel text-xs border-2 transition-all hover:opacity-80 disabled:opacity-50"
                      style={{
                        backgroundColor: COLORS.parchment,
                        borderColor: `${COLORS.woodDark}80`,
                        color: COLORS.woodDark,
                      }}
                    >
                      {interest}
                    </button>
                  ))}
              </div>
            </div>

            {/* Queue Info */}
            <div 
              className="flex items-center justify-center gap-2 text-sm mb-2"
              style={{ color: `${COLORS.woodDark}AA` }}
            >
              <Users className="w-4 h-4" />
              <span className="font-pixel">{queueSize} PLAYERS ONLINE</span>
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="mb-4 p-3 text-center border-2"
                style={{ 
                  backgroundColor: `${COLORS.primaryDark}20`,
                  borderColor: COLORS.primaryDark,
                }}
              >
                <p className="font-pixel text-sm" style={{ color: COLORS.primaryDark }}>{error}</p>
              </div>
            )}

            {/* Privacy Notice */}
            <div 
              className="p-3 border-2"
              style={{ 
                backgroundColor: `${COLORS.cork}50`,
                borderColor: COLORS.woodShadow,
              }}
            >
              <p className="text-center text-xs" style={{ color: `${COLORS.woodDark}AA` }}>
                🔒 Your conversations are ephemeral and not recorded. Be respectful to fellow adventurers!
              </p>
            </div>
          </div>

          {/* Cabinet Footer (Control Panel) */}
          <div 
            className="p-4 shrink-0 flex justify-center"
            style={{ 
              backgroundColor: COLORS.woodMedium, 
              borderTop: `4px solid ${COLORS.woodShadow}` 
            }}
          >
            {/* HUGE Start Button */}
            <button
              onClick={handleStart}
              disabled={!selectedMode}
              className="w-full max-w-md font-pixel text-xl md:text-2xl py-3 uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-2px] active:translate-y-[4px] active:border-b-0"
              style={{
                backgroundColor: selectedMode ? COLORS.primary : COLORS.woodLight,
                color: 'white',
                borderBottom: `8px solid ${selectedMode ? COLORS.primaryDark : COLORS.woodShadow}`,
                boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
                borderRadius: '4px',
              }}
            >
              <Play className={`w-8 h-8 ${selectedMode ? 'animate-pulse' : ''}`} />
              {selectedMode ? 'INSERT COIN & START' : 'SELECT A MODE'}
            </button>
          </div>

        </div>
      </main>

      {/* CSS for custom scrollbar & animation */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${COLORS.cork};
          border: 2px solid ${COLORS.woodShadow};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${COLORS.woodMedium};
          border: 2px solid ${COLORS.woodShadow};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${COLORS.woodDark};
        }
        @keyframes pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop {
          animation: pop 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
