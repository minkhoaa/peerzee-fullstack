"use client";

import { useState } from "react";
import { Video, MessageSquare, Sparkles, X, Users, Heart, BookOpen, UserPlus } from "lucide-react";

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

interface ModeSelectorProps {
  onStart: (mode: "text" | "video", interests: string[], intentMode: IntentMode, genderPref: GenderPref) => void;
  queueSize: number;
  error: string | null;
}

export function ModeSelector({ onStart, queueSize, error }: ModeSelectorProps) {
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
    { value: 'DATE' as IntentMode, label: 'Date', icon: Heart, color: 'text-pink-400' },
    { value: 'STUDY' as IntentMode, label: 'Study Buddy', icon: BookOpen, color: 'text-blue-400' },
    { value: 'FRIEND' as IntentMode, label: 'Friends', icon: UserPlus, color: 'text-green-400' },
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
    <div className="h-[100dvh] w-full bg-[#ECC8CD] flex items-center justify-center p-3 overflow-hidden">
      <div className="bg-[#FDF0F1] rounded-[40px] shadow-2xl shadow-[#CD6E67]/20 p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-block bg-white rounded-full p-3 shadow-lg shadow-[#CD6E67]/20 mb-2">
            <Sparkles className="w-8 h-8 text-[#CD6E67]" />
          </div>
          <h1 className="text-[#3E3229] text-2xl font-extrabold mb-1">
            Welcome to Cozy Match
          </h1>
          <p className="text-[#7A6862] text-sm font-medium">
            Choose how you want to connect with strangers
          </p>
        </div>

        {/* Intent Mode Selection */}
        <div className="mb-4">
          <label className="text-[#3E3229] font-extrabold mb-2 block text-sm">Looking for</label>
          <div className="grid grid-cols-3 gap-2">
            {intentModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => setIntentMode(mode.value)}
                  className={`p-3 rounded-[20px] border-4 transition-all flex flex-col items-center gap-1 ${
                    intentMode === mode.value
                      ? 'border-[#CD6E67] bg-white shadow-xl shadow-[#CD6E67]/30'
                      : 'border-transparent bg-white hover:border-[#ECC8CD] shadow-md'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${intentMode === mode.value ? 'text-[#CD6E67]' : 'text-[#7A6862]'}`} />
                  <span className="text-xs text-[#3E3229] font-bold">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender Preference */}
        <div className="mb-4">
          <label className="text-[#3E3229] font-extrabold mb-2 block text-sm">Match with</label>
          <div className="flex gap-2">
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGenderPref(opt.value)}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all ${
                  genderPref === opt.value
                    ? 'bg-[#CD6E67] text-white shadow-md shadow-[#CD6E67]/30'
                    : 'bg-white text-[#7A6862] hover:bg-[#F8E3E6]'
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
            className={`p-4 rounded-[30px] border-4 transition-all ${
              selectedMode === "text"
                ? "border-[#CD6E67] bg-white shadow-xl shadow-[#CD6E67]/30"
                : "border-transparent bg-white hover:border-[#ECC8CD] shadow-md"
            }`}
          >
            <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${selectedMode === "text" ? "text-[#CD6E67]" : "text-[#7A6862]"}`} />
            <h3 className="text-[#3E3229] text-base font-extrabold mb-1">Text Chat</h3>
            <p className="text-[#7A6862] text-xs font-medium">Chat anonymously via messages</p>
          </button>

          <button
            onClick={() => setSelectedMode("video")}
            className={`p-4 rounded-[30px] border-4 transition-all ${
              selectedMode === "video"
                ? "border-[#CD6E67] bg-white shadow-xl shadow-[#CD6E67]/30"
                : "border-transparent bg-white hover:border-[#ECC8CD] shadow-md"
            }`}
          >
            <Video className={`w-8 h-8 mx-auto mb-2 ${selectedMode === "video" ? "text-[#CD6E67]" : "text-[#7A6862]"}`} />
            <h3 className="text-[#3E3229] text-base font-extrabold mb-1">Video Chat</h3>
            <p className="text-[#7A6862] text-xs font-medium">Face-to-face video conversation</p>
          </button>
        </div>

        {/* Interests Input */}
        <div className="mb-4">
          <label className="text-[#3E3229] font-extrabold mb-2 block text-sm">
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
              className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-[#3E3229] placeholder-[#9CA3AF] outline-none focus:ring-2 focus:ring-[#CD6E67] shadow-inner"
              maxLength={20}
            />
            <button
              type="button"
              onClick={() => handleAddInterest(interestInput)}
              disabled={!interestInput || interests.length >= 5}
              className="bg-[#CD6E67] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#B55B55] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="bg-[#CD6E67] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-all"
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
                  className="bg-white text-[#CD6E67] px-2.5 py-1 rounded-full text-xs font-bold hover:bg-[#CD6E67] hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {interest}
                </button>
              ))}
          </div>
        </div>

        {/* Queue Info */}
        <div className="flex items-center justify-center gap-2 text-[#7A6862] text-xs mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>{queueSize} people online</span>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!selectedMode}
          className="w-full bg-[#CD6E67] text-white py-3 rounded-full text-lg font-extrabold hover:bg-[#B55B55] transition-all shadow-xl shadow-[#CD6E67]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedMode === "text" ? "Start Text Chat" : selectedMode === "video" ? "Start Video Chat" : "Select a Mode"}
        </button>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-xs mt-3 text-center font-medium">{error}</p>
        )}

        {/* Privacy Notice */}
        <p className="text-center text-[#7A6862] text-xs font-medium mt-3">
          🔒 Your conversations are ephemeral and not recorded. Be respectful!
        </p>
      </div>
    </div>
  );
}
