'use client';

import React, { useState, useRef } from 'react';
import { Image, Smile, Send, Loader2, User, PenLine, X } from 'lucide-react';

interface WriteNoteProps {
  onSubmit: (payload: { content: string; imageUrls?: string[]; tags?: string[] }) => void;
  isSubmitting?: boolean;
  userAvatar?: string;
}

/**
 * WriteNote - Input area for creating new posts
 * Fresh Sage & Cool Taupe palette with Image Upload
 */
export function WriteNote({ onSubmit, isSubmitting, userAvatar }: WriteNoteProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if ((!content.trim() && images.length === 0) || isSubmitting) return;
    
    // Extract hashtags from content
    const tags = content.match(/#\w+/g)?.map(t => t.slice(1)) || [];
    
    onSubmit({ content, imageUrls: images.length > 0 ? images : undefined, tags });
    setContent('');
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    // Process each file
    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - images.length); i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) continue;
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        continue;
      }

      // Convert to base64 for preview (in production, upload to server)
      const reader = new FileReader();
      const imageUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      newImages.push(imageUrl);
    }
    
    setImages(prev => [...prev, ...newImages].slice(0, 4));
    setIsUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-3 border-cocoa p-4 bg-retro-paper shadow-pixel">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

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

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-20 h-20 object-cover border-2 border-cocoa rounded"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-pixel-red border-2 border-cocoa rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" strokeWidth={3} />
              </button>
            </div>
          ))}
          {images.length < 4 && (
            <button
              onClick={handleImageClick}
              className="w-20 h-20 border-2 border-dashed border-cocoa rounded flex items-center justify-center text-cocoa-light hover:border-cocoa hover:text-cocoa transition-colors"
            >
              <Image className="w-6 h-6" strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-cocoa">
        {/* Media Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleImageClick}
            disabled={images.length >= 4 || isUploading}
            className={`p-2 rounded hover:bg-cocoa/10 transition-colors ${
              images.length > 0 ? 'text-pixel-pink' : 'text-cocoa-light'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={images.length >= 4 ? 'Max 4 images' : 'Add image'}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Image className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
          <button
            className="p-2 rounded hover:bg-cocoa/10 transition-colors text-cocoa-light"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" strokeWidth={2.5} />
          </button>
          {images.length > 0 && (
            <span className="text-xs font-body text-cocoa-light">
              {images.length}/4 images
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && images.length === 0) || isSubmitting}
          className={`px-5 py-2 font-pixel text-sm uppercase border-3 border-cocoa transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 font-bold ${
            (content.trim() || images.length > 0)
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
