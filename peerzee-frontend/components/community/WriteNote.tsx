'use client';

import React, { useState } from 'react';
import { Image, Smile, Send, Loader2, User, PenLine } from 'lucide-react';

interface WriteNoteProps {
  onSubmit: (payload: { content: string; imageUrls?: string[]; tags?: string[] }) => void;
  isSubmitting?: boolean;
  userAvatar?: string;
}

/**
 * WriteNote - Input area for creating new posts
 * Fresh Sage & Cool Taupe palette
 */
export function WriteNote({ onSubmit, isSubmitting, userAvatar }: WriteNoteProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim() || isSubmitting) return;
    
    // Extract hashtags from content
    const tags = content.match(/#\w+/g)?.map(t => t.slice(1)) || [];
    
    onSubmit({ content, tags });
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-3 border-cocoa p-4 bg-retro-paper shadow-pixel">
      {/* Header */}
      <h3 className="font-pixel text-lg mb-3 flex items-center gap-2 text-cocoa font-bold">
        <PenLine className="w-5 h-5" strokeWidth={2.5} /> Write a Note
      </h3>

      {/* Input Area */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 border-2 border-cocoa flex-shrink-0 overflow-hidden bg-retro-white">
          {userAvatar ? (
            <img src={userAvatar} alt="You" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-cocoa/10">
              <User className="w-5 h-5 text-cocoa" strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's happening in the village?"
            rows={2}
            className="w-full resize-none outline-none text-sm font-body font-bold bg-transparent text-cocoa placeholder:text-cocoa-light"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-cocoa">
        {/* Media Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded hover:bg-cocoa/10 transition-colors text-cocoa-light"
            title="Add image"
          >
            <Image className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button
            className="p-2 rounded hover:bg-cocoa/10 transition-colors text-cocoa-light"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`px-5 py-2 font-pixel text-sm uppercase border-3 border-cocoa transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 font-bold ${
            content.trim() 
              ? 'bg-pixel-pink text-cocoa shadow-pixel-sm' 
              : 'bg-retro-white text-cocoa-light'
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'PIN NOTE'
          )}
        </button>
      </div>
    </div>
  );
}

export default WriteNote;
