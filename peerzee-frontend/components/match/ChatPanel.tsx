"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquareText, Search, Clock } from "lucide-react";
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
      <div className="p-4 border-b-3 border-cocoa bg-pixel-blue/30">
        <h2 className="text-cocoa text-base font-pixel uppercase tracking-widest mb-2 flex items-center gap-2">
          {isConnected ? (
            <><MessageSquareText className="w-4 h-4" strokeWidth={2.5} /> Chatting with Stranger</>
          ) : state === 'searching' ? (
            <><Search className="w-4 h-4" strokeWidth={2.5} /> Finding a match...</>
          ) : (
            <><Clock className="w-4 h-4" strokeWidth={2.5} /> Waiting...</>
          )}
        </h2>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-pixel-yellow text-cocoa px-2 py-1 rounded-md border-2 border-cocoa text-xs font-bold shadow-pixel-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-retro-paper">
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.sender === "system" ? (
              <div className="text-center py-2">
                <span className="text-cocoa-light text-xs font-bold bg-retro-white px-3 py-1 rounded-lg border-2 border-cocoa/30">
                  {msg.content}
                </span>
              </div>
            ) : (
              <div className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg border-2 border-cocoa shadow-pixel-sm ${
                    msg.sender === "me"
                      ? "bg-pixel-pink text-cocoa"
                      : "bg-retro-white text-cocoa"
                  }`}
                >
                  <p className="text-sm font-bold">{msg.content}</p>
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
      <div className="p-4 border-t-3 border-cocoa bg-retro-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-retro-white rounded-lg py-2.5 px-4 border-3 border-cocoa shadow-pixel-inset focus:ring-2 focus:ring-pixel-pink outline-none text-cocoa font-bold placeholder-cocoa-light disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-pixel-pink text-cocoa p-3 rounded-lg border-2 border-cocoa hover:bg-pixel-pink-dark transition-all shadow-pixel-sm disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
