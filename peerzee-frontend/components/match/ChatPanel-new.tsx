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
    <div className="flex-[1] h-full bg-[#FDF0F1]/80 backdrop-blur-md rounded-[40px] shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-[#ECC8CD]/30">
        <h2 className="text-[#3E3229] text-lg font-extrabold mb-2">
          {isConnected ? "You're chatting with a Stranger" : state === 'searching' ? "Finding a match..." : "Waiting..."}
        </h2>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-white text-[#CD6E67] px-2 py-1 rounded-md text-xs font-bold shadow-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.sender === "system" ? (
              <div className="text-center text-[#7A6862] text-sm italic py-2">
                {msg.content}
              </div>
            ) : (
              <div className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-[20px] shadow-sm ${
                    msg.sender === "me"
                      ? "bg-[#CD6E67] text-white shadow-[#CD6E67]/30"
                      : "bg-white text-[#3E3229]"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === "me" ? "text-white/70" : "text-[#7A6862]"
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
      <div className="p-6 border-t-2 border-[#ECC8CD]/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 bg-white rounded-[30px] py-3 px-5 shadow-inner focus:ring-2 focus:ring-[#CD6E67] outline-none text-[#3E3229] placeholder-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="bg-[#CD6E67] text-white p-3 rounded-full hover:bg-[#B55B55] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
