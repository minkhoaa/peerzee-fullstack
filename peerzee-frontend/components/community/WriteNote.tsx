'use client';

import React, { useState } from 'react';
import { Image, Smile, Send, Loader2 } from 'lucide-react';

// ============================================
// VILLAGE THEME COLORS
// ============================================
const COLORS = {
  parchment: '#FDF5E6',
  parchmentDark: '#F5E6D3',
  wood: '#8B5A2B',
  woodDark: '#4A3B32',
  text: '#3E2723',
  textMuted: '#795548',
  orange: '#E65100',
  green: '#2E7D32',
} as const;

interface WriteNoteProps {
  onSubmit: (payload: { content: string; imageUrls?: string[]; tags?: string[] }) => void;
  isSubmitting?: boolean;
  userAvatar?: string;
}

/**
 * WriteNote - Input area for creating new posts
 * "Write a Note" style matching the Village theme
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
    <div
      className="border-4 p-4"
      style={{
        backgroundColor: COLORS.parchment,
        borderColor: COLORS.woodDark,
        boxShadow: '4px 4px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <h3
        className="font-pixel text-lg mb-3 flex items-center gap-2"
        style={{ color: COLORS.text }}
      >
        ✏️ Write a Note
      </h3>

      {/* Input Area */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 border-2 flex-shrink-0 overflow-hidden"
          style={{ borderColor: COLORS.woodDark, backgroundColor: COLORS.parchmentDark }}
        >
          {userAvatar ? (
            <img src={userAvatar} alt="You" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
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
            className="w-full resize-none outline-none text-sm font-body"
            style={{
              backgroundColor: 'transparent',
              color: COLORS.text,
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed" style={{ borderColor: COLORS.wood }}>
        {/* Media Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded hover:bg-black/5 transition-colors"
            style={{ color: COLORS.textMuted }}
            title="Add image"
          >
            <Image className="w-5 h-5" />
          </button>
          <button
            className="p-2 rounded hover:bg-black/5 transition-colors"
            style={{ color: COLORS.textMuted }}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="px-5 py-2 font-pixel text-sm uppercase border-3 transition-all hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{
            backgroundColor: content.trim() ? COLORS.orange : COLORS.parchmentDark,
            borderColor: COLORS.woodDark,
            color: content.trim() ? '#FFF' : COLORS.textMuted,
            boxShadow: content.trim() ? `3px 3px 0px ${COLORS.woodDark}` : 'none',
          }}
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
