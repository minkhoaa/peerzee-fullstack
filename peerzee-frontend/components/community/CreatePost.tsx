'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X, Loader2, Film, Send, Hash } from 'lucide-react';
import type { CreatePostPayload } from '@/types/community';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa - Primary text
  textMuted: '#8D6E63',      // Lighter brown - Secondary text
  background: '#FFFFFF',      // Pure White - Card background
  border: '#4A3228',          // Dark Coffee - Borders
  interactive: '#D946EF',     // Magenta - Links/buttons
  placeholder: '#A1887F',     // Readable Brown - Placeholders
  buttonBg: '#FF9EB5',        // Soft Pink - Button background
} as const;

// ============================================
// FILE PREVIEW TYPE
// ============================================
interface FilePreview extends File {
  preview: string;
}

// ============================================
// CREATE POST WIDGET
// ============================================
interface CreatePostProps {
  onSubmit?: (payload: CreatePostPayload) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
}

export default function CreatePost({ 
  onSubmit, 
  isSubmitting = false,
  placeholder = "What's on your mind, adventurer? ✨"
}: CreatePostProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    setFiles(prev => [...prev, ...newFiles].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    noClick: true,
    noKeyboard: true,
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if ((!content.trim() && files.length === 0) || isSubmitting || isUploading) return;

    try {
      setIsUploading(true);
      
      // In real implementation, upload files first and get URLs
      const imageUrls = files.map(f => f.preview); // Mock - replace with actual upload
      
      const payload: CreatePostPayload = {
        content: content.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      await onSubmit?.(payload);
      
      // Reset form
      setContent('');
      files.forEach(file => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setTags([]);
      setIsFocused(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isUploading || isSubmitting;
  const canSubmit = (content.trim() || files.length > 0) && !isLoading;

  return (
    <div 
      {...getRootProps()} 
      className={`bg-white border-[3px] border-[#4A3228] shadow-[4px_4px_0px_#4A3228] rounded-lg mb-6 overflow-hidden transition-all ${
        isDragActive ? 'border-[#D946EF] shadow-[4px_4px_0px_#D946EF]' : ''
      }`}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b-[2px] border-[#4A3228]/20"
        style={{ backgroundColor: '#FFF9F5' }}
      >
        <h3 
          className="font-pixel text-lg uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          📝 POST QUEST
        </h3>
      </div>

      {/* Input Area */}
      <div className="p-4">
        <input {...getInputProps()} />
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          rows={isFocused || content ? 4 : 2}
          disabled={isLoading}
          className="w-full px-4 py-3 border-2 border-dashed border-[#4A3228] rounded-lg bg-white text-base leading-relaxed resize-none outline-none focus:border-solid focus:border-[#D946EF] transition-all placeholder:text-[#A1887F]"
          style={{ color: COLORS.text }}
        />

        {/* File Previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg border-[3px] border-[#4A3228] overflow-hidden"
              >
                {file.type.startsWith('video/') ? (
                  <div className="w-full h-full bg-[#4A3228]/10 flex items-center justify-center">
                    <Film className="w-8 h-8" style={{ color: COLORS.border }} />
                  </div>
                ) : (
                  <img 
                    src={file.preview} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 border-2 border-[#4A3228] rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {(isFocused || tags.length > 0) && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2 items-center">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border-[2px] border-[#4A3228] font-pixel text-xs uppercase"
                  style={{ 
                    backgroundColor: COLORS.background, 
                    color: COLORS.interactive 
                  }}
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4" style={{ color: COLORS.placeholder }} />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleAddTag}
                    placeholder="Add tag"
                    className="w-20 px-1 py-0.5 text-sm border-b-2 border-dashed border-[#4A3228]/50 bg-transparent outline-none focus:border-[#D946EF] placeholder:text-[#A1887F]"
                    style={{ color: COLORS.text }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {(isFocused || content || files.length > 0) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-dashed border-[#4A3228]/30">
            <div className="flex items-center gap-2">
              {/* Add Media Button */}
              <button
                onClick={open}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-[2px] border-[#4A3228] bg-white hover:bg-pink-50 transition-colors font-pixel text-xs uppercase"
                style={{ color: COLORS.text }}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">ADD MEDIA</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Cancel Button */}
              {(content || files.length > 0) && (
                <button
                  onClick={() => {
                    setContent('');
                    setFiles([]);
                    setTags([]);
                    setIsFocused(false);
                  }}
                  disabled={isLoading}
                  className="px-3 py-2 font-pixel text-xs uppercase hover:bg-gray-100 rounded-lg transition-colors"
                  style={{ color: COLORS.textMuted }}
                >
                  CANCEL
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-[2px] border-[#4A3228] font-pixel font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_#4A3228] hover:shadow-[1px_1px_0px_#4A3228] hover:translate-x-[1px] hover:translate-y-[1px] ${
                  canSubmit 
                    ? 'bg-[#FF9EB5] cursor-pointer' 
                    : 'bg-gray-200 cursor-not-allowed opacity-50'
                }`}
                style={{ color: COLORS.border }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    POSTING...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    POST QUEST
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-[#D946EF]/20 border-[3px] border-dashed border-[#D946EF] rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-2" style={{ color: COLORS.interactive }} />
            <p className="font-pixel text-lg" style={{ color: COLORS.interactive }}>
              DROP FILES HERE
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
