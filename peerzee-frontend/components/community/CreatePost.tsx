'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X, Loader2, Film, Send, Hash, FileText } from 'lucide-react';
import type { CreatePostPayload } from '@/types/community';

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
  placeholder = "What's on your mind, adventurer?"
}: CreatePostProps) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const defaultPlaceholder = "What's on your mind, adventurer?";
  const actualPlaceholder = placeholder || defaultPlaceholder;

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
      className={`bg-retro-white border-3 border-cocoa shadow-pixel rounded-lg mb-6 overflow-hidden transition-all ${
        isDragActive ? 'border-pixel-pink shadow-[4px_4px_0px_theme(colors.pixel-pink)]' : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b-[2px] border-cocoa/20 bg-retro-cream">
        <h3 className="font-pixel text-lg uppercase tracking-wide flex items-center gap-2 text-cocoa">
          <FileText className="w-5 h-5" strokeWidth={2.5} /> POST QUEST
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
          className="w-full px-4 py-3 border-3 border-dashed border-cocoa rounded-lg bg-retro-white text-base leading-relaxed resize-none outline-none focus:border-solid focus:border-pixel-pink transition-all placeholder:text-cocoa-light font-body font-bold text-cocoa shadow-pixel-sm"
        />

        {/* File Previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl border-3 border-cocoa overflow-hidden shadow-pixel-sm"
              >
                {file.type.startsWith('video/') ? (
                  <div className="w-full h-full bg-cocoa/10 flex items-center justify-center">
                    <Film className="w-8 h-8 text-cocoa" />
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
                  className="absolute top-1 right-1 w-6 h-6 bg-pixel-red border-2 border-cocoa rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border-2 border-cocoa font-pixel text-xs uppercase bg-cocoa text-retro-white"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-pixel-red"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4 text-cocoa-light" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={handleAddTag}
                    placeholder="Add tag"
                    className="w-20 px-1 py-0.5 text-sm border-b-2 border-dashed border-cocoa/50 bg-transparent outline-none focus:border-pixel-pink placeholder:text-cocoa-light text-cocoa font-body font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {(isFocused || content || files.length > 0) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-dashed border-cocoa/30">
            <div className="flex items-center gap-2">
              {/* Add Media Button */}
              <button
                onClick={open}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-3 border-cocoa bg-retro-white hover:bg-pixel-pink/20 transition-colors font-pixel text-xs uppercase text-cocoa shadow-pixel-sm"
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
                  className="px-3 py-2 font-pixel text-xs uppercase hover:bg-cocoa/10 rounded-lg transition-colors text-cocoa-light"
                >
                  CANCEL
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-cocoa font-pixel font-bold text-sm uppercase transition-all shadow-pixel-sm hover:shadow-[1px_1px_0px_theme(colors.cocoa)] hover:translate-x-[1px] hover:translate-y-[1px] ${
                  canSubmit 
                    ? 'bg-pixel-pink cursor-pointer text-cocoa' 
                    : 'bg-cocoa/20 cursor-not-allowed opacity-50 text-cocoa'
                }`}
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
        <div className="absolute inset-0 bg-pixel-pink/20 border-3 border-dashed border-pixel-pink rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 text-pixel-pink" />
            <p className="font-pixel text-lg text-pixel-pink">
              DROP FILES HERE
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
