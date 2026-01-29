"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { VideoDatingState } from "@/hooks/useVideoDating";
import { WoodenFrame, CarvedInput, PixelButton } from "@/components/village";

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
    <div className="flex-[1] h-full">
      <WoodenFrame className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-3 border-wood-dark/30">
          <h2 className="font-pixel text-lg text-wood-dark mb-2">
            {isConnected ? "CHATTING WITH STRANGER" : state === 'searching' ? "FINDING MATCH..." : "WAITING..."}
          </h2>
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-primary-orange text-parchment px-2 py-1 font-pixel text-xs border-2 border-wood-dark"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chat Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-parchment/50">
          {messages.map((msg, idx) => (
            <div key={idx}>
              {msg.sender === "system" ? (
                <div className="text-center py-2">
                  <span className="bg-cork/50 text-wood-dark/70 px-3 py-1 font-pixel text-xs border border-wood-dark/30">
                    {msg.content}
                  </span>
                </div>
              ) : (
                <div className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-3 border-3 ${
                      msg.sender === "me"
                        ? "bg-primary-orange text-parchment border-wood-dark"
                        : "bg-parchment text-wood-dark border-wood-dark"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 font-pixel ${
                        msg.sender === "me" ? "text-parchment/70" : "text-wood-dark/60"
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
        <div className="p-4 border-t-3 border-wood-dark/30">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1">
              <CarvedInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={!isConnected}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || !isConnected}
              className="p-3 bg-primary-orange text-parchment border-3 border-wood-dark hover:bg-primary-red transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </WoodenFrame>
    </div>
  );
}
