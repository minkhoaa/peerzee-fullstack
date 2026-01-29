"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { VideoDatingState } from "@/hooks/useVideoDating";

interface Message {
  sender: "me" | "stranger" | "system";
  content: string;
  timestamp: Date;
}

interface MatchInfo {
  sessionId: string;
  partnerId: string;
  isInitiator: boolean;
}

interface ChatPanelProps {
  state: VideoDatingState;
  matchInfo: MatchInfo | null;
  interests: string[];
  messages: Message[];
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ state, matchInfo, interests, messages, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isConnected = state === 'matched' || state === 'connected';

  return (
    <div className="flex-[1] h-full bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-3 border-cocoa">
        <h2 className="text-cocoa font-pixel uppercase tracking-widest text-lg mb-2">
          {isConnected ? "You're chatting with a Stranger" : state === 'searching' ? "Finding a match..." : "Waiting..."}
        </h2>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-pixel-yellow text-cocoa px-2 py-1 rounded-lg text-xs font-bold border-2 border-cocoa"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-retro-paper">
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.sender === "system" ? (
              <div className="text-center text-cocoa-light text-sm italic py-2 font-medium">
                {msg.content}
              </div>
            ) : (
              <div className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-xl border-2 border-cocoa ${
                    msg.sender === "me"
                      ? "bg-pixel-pink text-cocoa shadow-pixel-sm"
                      : "bg-retro-white text-cocoa"
                  }`}
                >
                  <p className="text-sm font-medium">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === "me" ? "text-cocoa/70" : "text-cocoa-light"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t-3 border-cocoa">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-retro-paper rounded-xl py-3 px-5 border-2 border-cocoa shadow-pixel-inset focus:ring-2 focus:ring-pixel-pink outline-none text-cocoa placeholder-cocoa-light font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-pixel-pink text-cocoa p-3 rounded-xl hover:bg-pixel-pink-dark transition-all border-2 border-cocoa shadow-pixel-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
