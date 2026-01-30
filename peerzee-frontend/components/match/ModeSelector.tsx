"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, MessageSquareText, Search, X, Users, Star, BookOpen, UserPlus, Dices, Bot, Sparkles, BrainCircuit } from "lucide-react";

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

interface ModeSelectorProps {
  onStart: (mode: "text" | "video", interests: string[], intentMode: IntentMode, genderPref: GenderPref, matchingType: 'normal' | 'semantic', searchQuery?: string) => void;
  queueSize: number;
  error: string | null;
  sessionRoomId?: string | null;
}

export function ModeSelector({ onStart, queueSize, error, sessionRoomId }: ModeSelectorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"text" | "video" | null>(null);
  const [intentMode, setIntentMode] = useState<IntentMode>('DATE');
  const [genderPref, setGenderPref] = useState<GenderPref>('all');
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [matchingType, setMatchingType] = useState<'normal' | 'semantic'>('normal');
  const [searchQuery, setSearchQuery] = useState('');

  const sampleQueries = [
    'Bạn nữ thích café Hà Nội',
    'Anh dev thích code',
    'Bạn học AI Sài Gòn',
    'Người thích du lịch',
  ];

  const suggestedInterests = [
    "Music", "Programming", "Movies", "Gaming", "Art", "Travel",
    "Photography", "Food", "Books", "Sports", "Anime", "Fashion"
  ];

  // Formal icons for intent modes
  const intentModes = [
    { value: 'DATE' as IntentMode, label: 'Date', icon: Star, color: 'text-pixel-pink' },
    { value: 'STUDY' as IntentMode, label: 'Study Buddy', icon: BookOpen, color: 'text-pixel-blue' },
    { value: 'FRIEND' as IntentMode, label: 'Friends', icon: UserPlus, color: 'text-pixel-green' },
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
      // Redirect to AI Console for semantic matching
      if (matchingType === 'semantic') {
        router.push('/match/agent');
        return;
      }

      onStart(selectedMode, interests, intentMode, genderPref, matchingType);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-retro-bg flex items-center justify-center p-3 overflow-hidden">
      <div className="bg-retro-paper border-3 border-cocoa rounded-xl shadow-pixel p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-pixel-purple border-3 border-cocoa rounded-xl p-3 shadow-pixel-sm mb-2">
            <Search className="w-8 h-8 text-cocoa" strokeWidth={2.5} />
          </div>
          <h1 className="font-pixel text-cocoa text-2xl uppercase tracking-widest mb-1">
            Arcade Match
          </h1>
          <p className="text-cocoa-light text-sm font-bold">
            {sessionRoomId
              ? "You've been invited to a private session!"
              : "Choose how you want to connect with strangers"}
          </p>
        </div>

        {sessionRoomId ? (
          <div className="mb-6">
            <div className="bg-pixel-yellow/20 border-3 border-pixel-yellow rounded-xl p-6 text-center shadow-pixel-sm">
              <Bot className="w-12 h-12 text-pixel-yellow mx-auto mb-3 animate-bounce" strokeWidth={2.5} />
              <h3 className="font-pixel text-cocoa text-xl uppercase tracking-widest mb-2">Room Detected</h3>
              <p className="text-cocoa-light text-sm font-bold mb-6">
                A private video chat session is waiting for you.<br />Click below to join with your camera and mic.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onStart("video", [], 'FRIEND', 'all', 'normal')}
                  className="w-full bg-pixel-green border-3 border-cocoa text-cocoa py-4 rounded-xl font-pixel text-xl uppercase tracking-widest hover:bg-green-400 transition-all shadow-pixel active:translate-y-0.5 active:shadow-none"
                >
                  ▶ Join Video Call
                </button>
                <button
                  onClick={() => router.push('/match')}
                  className="text-cocoa-light text-xs font-pixel uppercase hover:text-cocoa transition-colors"
                >
                  Wait, show me other modes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Intent Mode Selection */}
            <div className="mb-4">
              <label className="font-pixel text-cocoa uppercase tracking-wider mb-2 block text-sm">Looking for</label>
              <div className="grid grid-cols-3 gap-2">
                {intentModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setIntentMode(mode.value)}
                      className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1 ${intentMode === mode.value
                        ? 'border-cocoa bg-pixel-pink shadow-pixel-sm'
                        : 'border-transparent bg-retro-white hover:border-cocoa'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${intentMode === mode.value ? 'text-cocoa' : 'text-cocoa-light'}`} strokeWidth={2.5} />
                      <span className="text-xs text-cocoa font-bold">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Preference */}
            <div className="mb-4">
              <label className="font-pixel text-cocoa uppercase tracking-wider mb-2 block text-sm">Match with</label>
              <div className="flex gap-2">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGenderPref(opt.value)}
                    className={`flex-1 py-2 px-3 text-xs font-bold transition-all border-2 rounded-lg ${genderPref === opt.value
                      ? 'bg-pixel-blue border-cocoa text-cocoa shadow-pixel-sm'
                      : 'bg-retro-white border-transparent text-cocoa-light hover:border-cocoa'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setSelectedMode("text")}
                className={`p-4 border-3 rounded-xl transition-all ${selectedMode === "text"
                  ? "border-cocoa bg-pixel-green shadow-pixel"
                  : "border-transparent bg-retro-white hover:border-cocoa"
                  }`}
              >
                <MessageSquareText className={`w-8 h-8 mx-auto mb-2 ${selectedMode === "text" ? "text-cocoa" : "text-cocoa-light"}`} strokeWidth={2.5} />
                <h3 className="font-pixel text-cocoa text-base uppercase tracking-widest mb-1">Text Chat</h3>
                <p className="text-cocoa-light text-xs font-medium">Chat anonymously via messages</p>
              </button>

              <button
                onClick={() => setSelectedMode("video")}
                className={`p-4 border-3 rounded-xl transition-all ${selectedMode === "video"
                  ? "border-cocoa bg-pixel-pink shadow-pixel"
                  : "border-transparent bg-retro-white hover:border-cocoa"
                  }`}
              >
                <Video className={`w-8 h-8 mx-auto mb-2 ${selectedMode === "video" ? "text-cocoa" : "text-cocoa-light"}`} strokeWidth={2.5} />
                <h3 className="font-pixel text-cocoa text-base uppercase tracking-widest mb-1">Video Chat</h3>
                <p className="text-cocoa-light text-xs font-medium">Face-to-face video conversation</p>
              </button>
            </div>

            {/* Matching Type Toggle */}
            <div className="mb-4">
              <label className="font-pixel text-cocoa uppercase tracking-wider mb-2 block text-sm">Matching Style</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMatchingType('normal')}
                  className={`p-3 border-2 rounded-lg transition-all flex flex-col items-center gap-1 ${matchingType === 'normal'
                    ? 'border-cocoa bg-pixel-yellow shadow-pixel-sm'
                    : 'border-transparent bg-retro-white hover:border-cocoa'
                    }`}
                >
                  <Dices className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                  <span className="text-xs text-cocoa font-bold">Random</span>
                  <span className="text-[10px] text-cocoa-light">Quick match</span>
                </button>
                <button
                  onClick={() => router.push('/match/agent')}
                  className="p-3 border-2 border-transparent bg-retro-white hover:border-cocoa rounded-lg transition-all flex flex-col items-center gap-1 hover:bg-pixel-purple/20"
                >
                  <BrainCircuit className="w-6 h-6 text-pixel-purple" strokeWidth={2.5} />
                  <span className="text-xs text-cocoa font-bold">AI Search</span>
                  <span className="text-[10px] text-cocoa-light">Smart match</span>
                </button>
              </div>
            </div>

            {/* AI Search Query - only show when semantic selected */}
            {matchingType === 'semantic' && (
              <div className="mb-4 p-4 bg-pixel-purple/10 border-2 border-pixel-purple rounded-lg">
                <label className="font-pixel text-cocoa uppercase tracking-wider mb-2 block text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pixel-purple" />
                  Describe your ideal match
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="E.g., Bạn nữ thích café ở Hà Nội..."
                  className="w-full bg-retro-white border-3 border-cocoa rounded-lg px-4 py-3 text-sm text-cocoa placeholder-cocoa-light outline-none focus:ring-2 focus:ring-pixel-purple shadow-pixel-inset font-bold"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {sampleQueries.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(q)}
                      className="px-2 py-1 bg-retro-white border-2 border-cocoa text-cocoa text-xs font-bold rounded-lg hover:bg-pixel-purple/20 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-cocoa-light mt-2 font-bold">
                  ✨ AI will find the best match based on your description
                </p>
              </div>
            )}

            {/* Interests Input */}
            <div className="mb-4">
              <label className="font-pixel text-cocoa uppercase tracking-wider mb-2 block text-sm">
                What do you want to talk about? (Optional)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInterest(interestInput);
                    }
                  }}
                  placeholder="Type an interest..."
                  className="flex-1 bg-retro-white border-3 border-cocoa rounded-lg px-4 py-2 text-sm text-cocoa placeholder-cocoa-light outline-none focus:ring-2 focus:ring-pixel-pink shadow-pixel-inset font-bold"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => handleAddInterest(interestInput)}
                  disabled={!interestInput || interests.length >= 5}
                  className="bg-pixel-green border-2 border-cocoa text-cocoa px-4 py-2 rounded-lg text-sm font-pixel uppercase tracking-wider hover:bg-green-400 transition-all shadow-pixel-sm disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
                >
                  Add
                </button>
              </div>

              {/* Selected Interests */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {interests.map((interest) => (
                    <span
                      key={interest}
                      className="bg-pixel-pink border-2 border-cocoa text-cocoa px-3 py-1 rounded-lg text-xs font-bold shadow-pixel-sm flex items-center gap-1"
                    >
                      {interest}
                      <button
                        onClick={() => handleRemoveInterest(interest)}
                        className="hover:bg-cocoa/20 rounded-md p-0.5 transition-all"
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
                      className="bg-retro-white border-2 border-cocoa text-cocoa px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-pixel-yellow transition-all shadow-pixel-sm disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
                    >
                      {interest}
                    </button>
                  ))}
              </div>
            </div>

            {/* Queue Info */}
            <div className="flex items-center justify-center gap-2 text-cocoa-light text-xs mb-3 font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>🌐 {queueSize} people online</span>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!selectedMode}
              className="w-full bg-pixel-pink border-3 border-cocoa text-cocoa py-3 rounded-xl font-pixel text-lg uppercase tracking-widest hover:bg-pixel-pink-dark transition-all shadow-pixel disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
            >
              {selectedMode === "text" ? "▶ Start Text Chat" : selectedMode === "video" ? "▶ Start Video Chat" : "Select a Mode"}
            </button>

            {/* Error Message */}
            {error && (
              <p className="text-pixel-red text-xs mt-3 text-center font-bold border-2 border-pixel-red rounded-lg p-2 bg-pixel-red/10">{error}</p>
            )}

            {/* Privacy Notice */}
            <p className="text-center text-cocoa-light text-xs font-bold mt-3">
              🔒 Your conversations are ephemeral and not recorded. Be respectful!
            </p>
          </>
        )}
      </div>
    </div>
  );
}
